import {spawn} from "node:child_process";
import crypto from "node:crypto";
import {createServer} from "node:http";
import {existsSync} from "node:fs";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const uploadsRoot = path.join(projectRoot, "out", "mvp", "uploads");
const analysesRoot = path.join(projectRoot, "out", "mvp", "analyses");
const remotionRoot = path.join(projectRoot, "out", "mvp", "remotion");
const rendersRoot = path.join(projectRoot, "out", "mvp", "renders");
const generatedAudioRoot = path.join(publicRoot, "mvp", "generated", "audio");
const generatedVideoRoot = path.join(publicRoot, "mvp", "generated", "videos");
const extractScript = path.join(projectRoot, "scripts", "extract-pdf-text.py");
const bundledSamplePdf = path.join(projectRoot, "jesc103.pdf");
const port = Number(process.env.PORT ?? 4321);
const defaultModel = process.env.OPENAI_MODEL ?? "gpt-5-mini";
const defaultTtsModel = "gpt-4o-mini-tts";
const maxBodyBytes = 25 * 1024 * 1024;
const maxSourceCharacters = 520_000;
const supportedVoices = new Set(["alloy", "ash", "coral", "marin", "sage", "cedar"]);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
};

const blueprintSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "meta",
    "hook",
    "summary",
    "learningGoals",
    "styleDirection",
    "scenes",
    "remotionPlan",
  ],
  properties: {
    meta: {
      type: "object",
      additionalProperties: false,
      required: [
        "sourceTitle",
        "sourcePageCount",
        "wordCount",
        "targetAudience",
        "targetLanguage",
        "estimatedRuntimeMinutes",
      ],
      properties: {
        sourceTitle: {type: "string"},
        sourcePageCount: {type: "number"},
        wordCount: {type: "number"},
        targetAudience: {type: "string"},
        targetLanguage: {type: "string"},
        estimatedRuntimeMinutes: {type: "number"},
      },
    },
    hook: {type: "string", maxLength: 220},
    summary: {type: "string", maxLength: 420},
    learningGoals: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {type: "string", maxLength: 120},
    },
    styleDirection: {
      type: "object",
      additionalProperties: false,
      required: [
        "tone",
        "visualWorld",
        "voiceStyle",
        "motionStrategy",
        "colorPalette",
      ],
      properties: {
        tone: {type: "string", maxLength: 120},
        visualWorld: {type: "string", maxLength: 120},
        voiceStyle: {type: "string", maxLength: 120},
        motionStrategy: {type: "string", maxLength: 180},
        colorPalette: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {type: "string", maxLength: 40},
        },
      },
    },
    scenes: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "template",
          "durationSeconds",
          "goal",
          "sourceAnchor",
          "visuals",
          "beats",
          "narration",
          "keyTerms",
        ],
        properties: {
          id: {type: "string", maxLength: 24},
          title: {type: "string", maxLength: 90},
          template: {type: "string", maxLength: 40},
          durationSeconds: {type: "number"},
          goal: {type: "string", maxLength: 180},
          sourceAnchor: {type: "string", maxLength: 40},
          visuals: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            items: {type: "string", maxLength: 120},
          },
          beats: {
            type: "array",
            minItems: 3,
            maxItems: 4,
            items: {type: "string", maxLength: 140},
          },
          narration: {type: "string", maxLength: 320},
          keyTerms: {
            type: "array",
            minItems: 3,
            maxItems: 6,
            items: {type: "string", maxLength: 32},
          },
        },
      },
    },
    remotionPlan: {
      type: "object",
      additionalProperties: false,
      required: [
        "compositionId",
        "fps",
        "width",
        "height",
        "sceneCount",
        "renderOrder",
        "assetNotes",
      ],
      properties: {
        compositionId: {type: "string", maxLength: 64},
        fps: {type: "number"},
        width: {type: "number"},
        height: {type: "number"},
        sceneCount: {type: "number"},
        renderOrder: {
          type: "array",
          minItems: 5,
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["sceneId", "startSeconds", "durationSeconds"],
            properties: {
              sceneId: {type: "string"},
              startSeconds: {type: "number"},
              durationSeconds: {type: "number"},
            },
          },
        },
        assetNotes: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {type: "string", maxLength: 180},
        },
      },
    },
  },
};

const defaultSettings = {
  audience: "Ages 12-15",
  runtimeMinutes: 6,
  tone: "Playful classroom adventure",
  language: "English",
  voiceStyle: "cedar",
  visualWorld: "Bold science lab storyboard",
  generateAudio: true,
  useAi: true,
};

const defaultFallbackScenes = [
  "Opening Hook",
  "Core Idea",
  "Worked Example",
  "Key Comparison",
  "Why It Matters",
  "Quick Recap",
];

await Promise.all([
  mkdir(uploadsRoot, {recursive: true}),
  mkdir(analysesRoot, {recursive: true}),
  mkdir(remotionRoot, {recursive: true}),
  mkdir(rendersRoot, {recursive: true}),
  mkdir(generatedAudioRoot, {recursive: true}),
  mkdir(generatedVideoRoot, {recursive: true}),
]);

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {"Content-Type": "application/json; charset=utf-8"});
  response.end(JSON.stringify(payload, null, 2));
};

const sendText = (response, statusCode, text) => {
  response.writeHead(statusCode, {"Content-Type": "text/plain; charset=utf-8"});
  response.end(text);
};

const sanitizeFileName = (fileName) =>
  (fileName || "book.pdf").replace(/[^a-zA-Z0-9._-]+/g, "-");

const slugify = (value) =>
  sanitizeFileName(String(value || "lesson"))
    .replace(/\.pdf$/i, "")
    .replace(/\.+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const titleCase = (value) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const clampNumber = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
};

const readJsonBody = async (request) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error(`Request body exceeded ${Math.round(maxBodyBytes / 1024 / 1024)}MB.`);
    }

    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
};

const safePublicPath = (pathname) => {
  const decoded = decodeURIComponent(pathname);
  const normalized =
    decoded === "/" || decoded === "/mvp"
      ? "/mvp/index.html"
      : decoded.endsWith("/")
        ? `${decoded}index.html`
        : decoded;
  const relativePath = normalized.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(publicRoot, relativePath));
  if (!filePath.startsWith(publicRoot)) {
    return null;
  }

  return filePath;
};

const serveStaticFile = async (requestPath, response) => {
  const filePath = safePublicPath(requestPath);
  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    const extension = path.extname(filePath);
    const buffer = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(buffer);
  } catch (error) {
    sendText(response, 404, "Not found");
  }
};

const extractPdfText = (pdfPath) =>
  new Promise((resolve, reject) => {
    const python = spawn("python", [extractScript, pdfPath], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf-8");
    });

    python.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf-8");
    });

    python.on("error", (error) => {
      reject(error);
    });

    python.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              "Python PDF extraction failed. Ensure Python and pypdf are installed.",
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Could not parse PDF extraction output: ${error.message}`));
      }
    });
  });

const splitSentences = (text) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const pickKeywords = (input, limit = 6) => {
  const matches = input.match(/\b[A-Za-z][A-Za-z-]{4,}\b/g) ?? [];
  const counts = new Map();

  for (const match of matches) {
    const normalized = match.toLowerCase();
    if (
      [
        "which",
        "their",
        "these",
        "there",
        "about",
        "because",
        "would",
        "could",
      ].includes(normalized)
    ) {
      continue;
    }

    counts.set(match, (counts.get(match) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
};

const sceneTemplateFor = (title, index) => {
  const lower = title.toLowerCase();
  if (lower.includes("compare") || lower.includes("difference")) {
    return "comparison-board";
  }

  if (
    lower.includes("reaction") ||
    lower.includes("oxygen") ||
    lower.includes("water") ||
    lower.includes("acid")
  ) {
    return "reaction-lab";
  }

  if (lower.includes("series") || lower.includes("order")) {
    return "ladder-chart";
  }

  if (lower.includes("bond") || lower.includes("atom")) {
    return "atomic-transfer";
  }

  if (lower.includes("summary") || lower.includes("recap")) {
    return "memory-board";
  }

  return [
    "cinematic-intro",
    "concept-cards",
    "diagram-explainer",
    "worked-example",
    "interactive-quiz",
    "memory-board",
  ][index % 6];
};

const voiceInstructions = (voice) => {
  switch (voice) {
    case "marin":
      return "Speak like a warm, expressive classroom storyteller for middle-school learners.";
    case "cedar":
      return "Speak like a calm, confident teacher for middle-school learners.";
    case "sage":
      return "Speak clearly and thoughtfully, like a patient science mentor for teenagers.";
    case "coral":
      return "Speak with bright energy, like an engaging classroom explainer.";
    case "ash":
      return "Speak with a clear, grounded pace and a supportive teacher tone.";
    case "alloy":
    default:
      return "Speak naturally, clearly, and in a friendly educational tone for teenagers.";
  }
};

const normalizeVoice = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return supportedVoices.has(normalized) ? normalized : defaultSettings.voiceStyle;
};

const buildMockBlueprint = (extraction, settings, analysisMode, warnings = []) => {
  const headings =
    extraction.headings.length > 0
      ? extraction.headings.slice(0, 7)
      : defaultFallbackScenes;
  const pagePreviews =
    extraction.pagePreviews.length > 0
      ? extraction.pagePreviews
      : [{page: 1, preview: extraction.text.slice(0, 280)}];
  const sceneCount = Math.max(5, Math.min(8, headings.length));
  const perSceneDuration = Math.max(
    28,
    Math.round((Number(settings.runtimeMinutes) || 6) * 60 / sceneCount),
  );

  const scenes = headings.slice(0, sceneCount).map((heading, index) => {
    const pagePreview = pagePreviews[index % pagePreviews.length];
    const sourceText =
      pagePreview.preview ||
      extraction.text.slice(index * 240, index * 240 + 280) ||
      extraction.title;
    const sentences = splitSentences(sourceText);
    const cleanedTitle = titleCase(heading);
    const sceneId = `scene-${String(index + 1).padStart(2, "0")}`;

    return {
      id: sceneId,
      title: cleanedTitle,
      template: sceneTemplateFor(cleanedTitle, index),
      durationSeconds: perSceneDuration,
      goal: `Help learners understand ${cleanedTitle.toLowerCase()} with one clear visual sequence.`,
      sourceAnchor: `Page ${pagePreview.page}`,
      visuals: [
        `Lead with a bold ${cleanedTitle.toLowerCase()} title card`,
        "Use icons, labels, and simple diagram motion instead of abstract effects",
        "End with a quick retention cue or checkpoint",
      ],
      beats: [
        `Introduce ${cleanedTitle.toLowerCase()} in child-friendly language`,
        sentences[0] || "Explain the main textbook idea from this section.",
        sentences[1] || "Show one example or visual proof from the source material.",
      ],
      narration: [
        `In this part, we focus on ${cleanedTitle.toLowerCase()}.`,
        sentences[0] || "We turn the textbook statement into a clear, spoken explanation.",
        sentences[1] || "Then we support it with motion, labels, and a quick recap.",
      ].join(" "),
      keyTerms: pickKeywords(`${cleanedTitle} ${sourceText}`, 6),
    };
  });

  let runningTime = 0;
  const renderOrder = scenes.map((scene) => {
    const startSeconds = runningTime;
    runningTime += scene.durationSeconds;
    return {
      sceneId: scene.id,
      startSeconds,
      durationSeconds: scene.durationSeconds,
    };
  });

  const firstScene = scenes[0]?.title ?? extraction.title;

  return {
    meta: {
      sourceTitle: extraction.title,
      sourcePageCount: extraction.pageCount,
      wordCount: extraction.wordCount,
      targetAudience: settings.audience,
      targetLanguage: settings.language,
      estimatedRuntimeMinutes: Number(settings.runtimeMinutes) || 6,
      analysisMode,
      warnings,
    },
    hook: `Open with ${firstScene.toLowerCase()} so the learner immediately knows what story the chapter is about.`,
    summary:
      splitSentences(extraction.text).slice(0, 2).join(" ") ||
      "This blueprint was created from the uploaded PDF and arranged into Remotion-ready scenes.",
    learningGoals: [
      `Identify the main ideas from ${extraction.title}`,
      "Break the chapter into short visual scenes",
      "Prepare narration and scene templates that can feed a Remotion render",
    ],
    styleDirection: {
      tone: settings.tone,
      visualWorld: settings.visualWorld,
      voiceStyle: settings.voiceStyle,
      motionStrategy:
        "Use punchy chapter transitions, bold diagrams, and recap beats that reward attention.",
      colorPalette: ["#081423", "#12344f", "#ffbf52", "#44d6b4", "#f7f1dd"],
    },
    scenes,
    remotionPlan: {
      compositionId: "BookChapterAutoStoryboard",
      fps: 30,
      width: 1920,
      height: 1080,
      sceneCount: scenes.length,
      renderOrder,
      assetNotes: [
        "Voiceover can be generated after the scene order is approved.",
        "Each scene template maps cleanly onto a Remotion composition with typed props.",
        "Keep SVGs, equation cards, and captions as reusable components.",
      ],
    },
  };
};

const extractOutputText = (responseJson) => {
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  const message = (responseJson.output ?? []).find((item) => item.type === "message");
  if (!message) {
    return "";
  }

  const fragments = [];
  for (const content of message.content ?? []) {
    if (content.type === "output_text" && typeof content.text === "string") {
      fragments.push(content.text);
    }
  }

  return fragments.join("\n").trim();
};

const createOpenAiPrompt = (extraction, settings, coverageNote) => {
  const sourceText =
    extraction.text.length > maxSourceCharacters
      ? extraction.text.slice(0, maxSourceCharacters)
      : extraction.text;

  return [
    "Create a structured educational-video blueprint from the textbook material below.",
    "The output will feed a Remotion pipeline that renders child-friendly explainer videos.",
    "Stay faithful to the textbook. Do not invent facts.",
    "Keep the JSON concise and production-friendly.",
    "Use 5 to 7 scenes unless the source clearly demands 8 scenes.",
    "For each scene, keep the goal to 1 short sentence, use 3 beats when possible, use 2 or 3 visuals, and keep narration to 1 or 2 short sentences.",
    "Prefer scene ideas that are easy to animate with text, icons, diagrams, equations, charts, and simple SVG motion.",
    "",
    `Source title: ${extraction.title}`,
    `Source page count: ${extraction.pageCount}`,
    `Source word count: ${extraction.wordCount}`,
    `Audience: ${settings.audience}`,
    `Target runtime: ${settings.runtimeMinutes} minutes`,
    `Language: ${settings.language}`,
    `Voice style: ${settings.voiceStyle}`,
    `Tone: ${settings.tone}`,
    `Visual world: ${settings.visualWorld}`,
    `Coverage note: ${coverageNote}`,
    `Detected headings: ${extraction.headings.join(" | ") || "No headings detected"}`,
    `Detected keywords: ${extraction.keywords.join(", ") || "No keywords detected"}`,
    "",
    "Source text:",
    sourceText,
  ].join("\n");
};

const callOpenAiForBlueprint = async (extraction, settings) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const coverageNote =
    extraction.text.length > maxSourceCharacters
      ? `Only the first ${maxSourceCharacters} characters were sent to the model for this MVP request.`
      : "The full extracted text was sent to the model.";

  const body = {
    model: defaultModel,
    max_output_tokens: 8000,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are an instructional designer and motion-graphics planner. Convert textbook material into a precise video blueprint for a Remotion rendering system. Return strict JSON only and keep every field concise.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: createOpenAiPrompt(extraction, settings, coverageNote),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "video_blueprint",
        strict: true,
        schema: blueprintSchema,
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const responseJson = await response.json();
  if (responseJson.status === "incomplete") {
    const reason = responseJson.incomplete_details?.reason ?? "unknown";
    throw new Error(`OpenAI response was incomplete (${reason}).`);
  }

  const outputText = extractOutputText(responseJson);
  if (!outputText) {
    throw new Error("OpenAI returned no structured text output.");
  }

  return JSON.parse(outputText);
};

const createSpeechAudio = async ({input, voice, outputPath}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: defaultTtsModel,
      voice,
      input,
      instructions: voiceInstructions(voice),
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI speech request failed (${response.status}): ${errorText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
};

const saveUploadFromBase64 = async (base64, fileName, jobId) => {
  const buffer = Buffer.from(base64, "base64");
  const safeName = sanitizeFileName(fileName);
  const filePath = path.join(uploadsRoot, `${jobId}-${safeName}`);
  await writeFile(filePath, buffer);
  return filePath;
};

const resolveSourcePdf = async (payload, jobId) => {
  if (payload.sampleFile) {
    if (payload.sampleFile !== "jesc103.pdf" || !existsSync(bundledSamplePdf)) {
      throw new Error("The requested sample PDF is not available.");
    }

    return {
      filePath: bundledSamplePdf,
      originalFileName: "jesc103.pdf",
      uploadKind: "sample",
    };
  }

  if (!payload.base64 || !payload.fileName) {
    throw new Error("Upload payload must include a PDF file.");
  }

  const storedPath = await saveUploadFromBase64(payload.base64, payload.fileName, jobId);
  return {
    filePath: storedPath,
    originalFileName: payload.fileName,
    uploadKind: "upload",
  };
};

const analyzePdf = async (payload) => {
  const jobId = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const settings = {
    ...defaultSettings,
    ...(payload.settings ?? {}),
  };

  settings.voiceStyle = normalizeVoice(settings.voiceStyle);
  const source = await resolveSourcePdf(payload, jobId);
  const extraction = await extractPdfText(source.filePath);
  const warnings = [];

  let blueprint;
  let analysisMode = "mock-no-key";

  if (process.env.OPENAI_API_KEY && settings.useAi !== false) {
    try {
      blueprint = await callOpenAiForBlueprint(extraction, settings);
      analysisMode = "ai";
    } catch (error) {
      warnings.push(error.message);
      blueprint = buildMockBlueprint(extraction, settings, "mock-fallback", warnings);
      analysisMode = "mock-fallback";
    }
  } else {
    blueprint = buildMockBlueprint(
      extraction,
      settings,
      process.env.OPENAI_API_KEY ? "mock-disabled" : "mock-no-key",
      warnings,
    );
    analysisMode = process.env.OPENAI_API_KEY ? "mock-disabled" : "mock-no-key";
  }

  blueprint.meta = {
    ...blueprint.meta,
    analysisMode,
    sourceFileName: source.originalFileName,
    createdAt: new Date().toISOString(),
  };

  const analysisPath = path.join(
    analysesRoot,
    `${jobId}-${slugify(source.originalFileName)}.json`,
  );
  await writeFile(analysisPath, JSON.stringify(blueprint, null, 2));

  return {
    jobId,
    analysisMode,
    warnings,
    source: {
      title: extraction.title,
      fileName: source.originalFileName,
      pageCount: extraction.pageCount,
      wordCount: extraction.wordCount,
      characterCount: extraction.characterCount,
      keywords: extraction.keywords,
      headings: extraction.headings,
      pagePreviews: extraction.pagePreviews,
      uploadKind: source.uploadKind,
    },
    blueprint,
    analysisFile: path.relative(projectRoot, analysisPath),
  };
};

const buildRemotionPackage = ({blueprint, settings, source}) => {
  if (!blueprint || !Array.isArray(blueprint.scenes) || blueprint.scenes.length === 0) {
    throw new Error("No reviewed blueprint was provided.");
  }

  const fps = clampNumber(blueprint.remotionPlan?.fps, 30, 24, 60);
  const width = clampNumber(blueprint.remotionPlan?.width, 1920, 720, 3840);
  const height = clampNumber(blueprint.remotionPlan?.height, 1080, 480, 2160);
  const runtimeMinutes = clampNumber(
    settings.runtimeMinutes ?? blueprint.meta?.estimatedRuntimeMinutes,
    6,
    1,
    20,
  );
  const targetFrames = Math.max(fps * 60, Math.round(runtimeMinutes * 60 * fps));
  const sourceTitle = source?.title || blueprint.meta?.sourceTitle || "Uploaded chapter";
  const voice = normalizeVoice(settings.voiceStyle || blueprint.styleDirection?.voiceStyle);
  const colorPalette =
    Array.isArray(blueprint.styleDirection?.colorPalette) &&
    blueprint.styleDirection.colorPalette.length >= 3
      ? blueprint.styleDirection.colorPalette.slice(0, 6)
      : ["#07111f", "#132b47", "#ffbf52", "#44d6b4", "#ff7d67"];
  const scenesInput = blueprint.scenes.slice(0, 8);
  const sceneDefaults = Math.max(18, Math.round((runtimeMinutes * 60) / scenesInput.length));
  const sceneDurations = scenesInput.map((scene) =>
    clampNumber(scene.durationSeconds, sceneDefaults, 12, 120),
  );
  const totalSceneSeconds =
    sceneDurations.reduce((sum, value) => sum + value, 0) || sceneDurations.length;

  let assignedFrames = 0;
  const scenes = scenesInput.map((scene, index, sceneList) => {
    const isLast = index === sceneList.length - 1;
    const durationInFrames = isLast
      ? Math.max(fps * 6, targetFrames - assignedFrames)
      : Math.max(
          fps * 6,
          Math.round((sceneDurations[index] / totalSceneSeconds) * targetFrames),
        );
    assignedFrames += durationInFrames;

    return {
      id: scene.id || `scene-${String(index + 1).padStart(2, "0")}`,
      title: scene.title || `Scene ${index + 1}`,
      template: scene.template || sceneTemplateFor(scene.title || "", index),
      durationInFrames,
      durationSeconds: Number((durationInFrames / fps).toFixed(2)),
      goal: scene.goal || "Explain the main idea clearly.",
      sourceAnchor: scene.sourceAnchor || `Scene ${index + 1}`,
      beats: Array.isArray(scene.beats) ? scene.beats.slice(0, 4) : [],
      visuals: Array.isArray(scene.visuals) ? scene.visuals.slice(0, 4) : [],
      narration: scene.narration || scene.goal || scene.title || "",
      keyTerms: Array.isArray(scene.keyTerms) ? scene.keyTerms.slice(0, 6) : [],
      audioPath: null,
    };
  });

  const totalDurationInFrames = scenes.reduce(
    (sum, scene) => sum + scene.durationInFrames,
    0,
  );

  return {
    schemaVersion: 1,
    compositionId: "BookAutoMvp",
    sourceTitle,
    sourceFileName: source?.fileName || blueprint.meta?.sourceFileName || "upload.pdf",
    hook: blueprint.hook || `Learn ${sourceTitle} in a short, animated lesson.`,
    summary: blueprint.summary || "A short lesson created from the uploaded PDF.",
    learningGoals: Array.isArray(blueprint.learningGoals)
      ? blueprint.learningGoals.slice(0, 6)
      : [],
    createdAt: new Date().toISOString(),
    runtimeMinutes,
    fps,
    width,
    height,
    totalDurationInFrames,
    totalDurationSeconds: Number((totalDurationInFrames / fps).toFixed(2)),
    voice: {
      provider: "openai",
      model: defaultTtsModel,
      preset: voice,
      instructions: voiceInstructions(voice),
    },
    style: {
      tone: blueprint.styleDirection?.tone || defaultSettings.tone,
      visualWorld:
        blueprint.styleDirection?.visualWorld || defaultSettings.visualWorld,
      colorPalette,
    },
    scenes,
  };
};

const packageBlueprint = async (payload) => {
  const jobId = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const settings = {
    ...defaultSettings,
    ...(payload.settings ?? {}),
  };
  settings.voiceStyle = normalizeVoice(settings.voiceStyle);

  const remotionPackage = buildRemotionPackage({
    blueprint: payload.blueprint,
    settings,
    source: payload.source ?? {},
  });

  const warnings = [];
  let audioGeneratedCount = 0;

  if (settings.generateAudio !== false && process.env.OPENAI_API_KEY) {
    for (const scene of remotionPackage.scenes) {
      try {
        const audioName = `${jobId}-${slugify(scene.id || scene.title)}.mp3`;
        const publicRelativePath = path.posix.join(
          "generated",
          "audio",
          audioName,
        );
        const absoluteAudioPath = path.join(generatedAudioRoot, audioName);
        await createSpeechAudio({
          input: scene.narration,
          voice: remotionPackage.voice.preset,
          outputPath: absoluteAudioPath,
        });
        scene.audioPath = publicRelativePath;
        audioGeneratedCount += 1;
      } catch (error) {
        warnings.push(
          `Audio for "${scene.title}" could not be created: ${error instanceof Error ? error.message : "Unknown error."}`,
        );
      }
    }
  } else {
    warnings.push(
      process.env.OPENAI_API_KEY
        ? "AI voice generation was skipped for this package."
        : "OPENAI_API_KEY was not found, so the package was created without AI voice audio.",
    );
  }

  const lessonSlug = slugify(remotionPackage.sourceTitle || "lesson");
  const packagePath = path.join(
    remotionRoot,
    `${jobId}-${lessonSlug}-remotion.json`,
  );
  const latestPackagePath = path.join(remotionRoot, "latest-remotion-package.json");
  await writeFile(packagePath, JSON.stringify(remotionPackage, null, 2));
  await writeFile(latestPackagePath, JSON.stringify(remotionPackage, null, 2));

  const renderCommand = `npx remotion render BookAutoMvp public/mvp/generated/videos/${lessonSlug}.mp4 --codec=h264 --public-dir=public/mvp --props=${path
    .relative(projectRoot, latestPackagePath)
    .replaceAll("\\", "/")}`;

  return {
    jobId,
    warnings,
    audioGeneratedCount,
    packageFile: path.relative(projectRoot, packagePath),
    latestPackageFile: path.relative(projectRoot, latestPackagePath),
    renderCommand,
    remotionPackage,
  };
};

const runRemotionRender = ({propsFile, outputFile}) =>
  new Promise((resolve, reject) => {
    const command = process.execPath;
    const cliScript = path.join(projectRoot, "node_modules", "@remotion", "cli", "remotion-cli.js");
    const args = [
      cliScript,
      "render",
      "BookAutoMvp",
      outputFile,
      "--codec=h264",
      "--public-dir=public/mvp",
      `--props=${propsFile.replaceAll("\\", "/")}`,
    ];

    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf-8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf-8");
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const output = (stderr || stdout).trim();
        const excerpt = output.split(/\r?\n/).slice(-20).join("\n");
        reject(new Error(excerpt || `Remotion render failed with exit code ${code}.`));
        return;
      }

      resolve({stdout, stderr});
    });
  });

const renderVideo = async (payload) => {
  const packaged = await packageBlueprint(payload);
  const lessonSlug = slugify(packaged.remotionPackage.sourceTitle || "lesson");
  const videoName = `${Date.now()}-${lessonSlug}.mp4`;
  const videoRelativePath = path.posix.join("public", "mvp", "generated", "videos", videoName);
  const videoPublicUrl = path.posix.join("/mvp/generated/videos", videoName);

  await runRemotionRender({
    propsFile: packaged.latestPackageFile,
    outputFile: videoRelativePath,
  });

  return {
    ...packaged,
    videoFile: videoRelativePath,
    videoUrl: videoPublicUrl,
  };
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      model: defaultModel,
      ttsModel: defaultTtsModel,
      ttsVoices: [...supportedVoices],
      samplePdfAvailable: existsSync(bundledSamplePdf),
      pythonExtractor: path.relative(projectRoot, extractScript),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/analyze") {
    try {
      const payload = await readJsonBody(request);
      const result = await analyzePdf(payload);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected server error.",
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/package") {
    try {
      const payload = await readJsonBody(request);
      const result = await packageBlueprint(payload);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected server error.",
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/render") {
    try {
      const payload = await readJsonBody(request);
      const result = await renderVideo(payload);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected server error.",
      });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/") {
    response.writeHead(302, {Location: "/mvp/"});
    response.end();
    return;
  }

  if (request.method === "GET") {
    await serveStaticFile(url.pathname, response);
    return;
  }

  sendText(response, 405, "Method not allowed");
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Gurukul Story Lab MVP running on http://localhost:${port}/mvp/ (OpenAI ${process.env.OPENAI_API_KEY ? "enabled" : "mock mode"})`,
  );
});
