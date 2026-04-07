const pipelineSteps = [
  {
    title: "Accept upload",
    copy: "Take the uploaded PDF and the chosen video length and AI voice.",
  },
  {
    title: "Extract text",
    copy: "Read the PDF locally so the chapter content becomes usable.",
  },
  {
    title: "Structure scenes",
    copy: "Use AI to turn the chapter into a short scene-by-scene lesson plan.",
  },
  {
    title: "Human review",
    copy: "Let you check and edit the generated JSON before generating the video.",
  },
  {
    title: "Generate video",
    copy: "Create scene voice clips, hand props to Remotion, and render the MP4.",
  },
];

const state = {
  file: null,
  health: null,
  result: null,
  packageResult: null,
  pipelineInterval: null,
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const refs = {
  analyzeButton: document.querySelector("#analyze-button"),
  analyzeSampleButton: document.querySelector("#analyze-sample-button"),
  analysisModeNote: document.querySelector("#analysis-mode-note"),
  connectionChip: document.querySelector("#connection-chip"),
  copyJsonButton: document.querySelector("#copy-json-button"),
  downloadJsonButton: document.querySelector("#download-json-button"),
  dropzone: document.querySelector("#dropzone"),
  goalList: document.querySelector("#goal-list"),
  hookCopy: document.querySelector("#hook-copy"),
  jsonEditor: document.querySelector("#json-editor"),
  metricsGrid: document.querySelector("#metrics-grid"),
  narrationList: document.querySelector("#narration-list"),
  packageButton: document.querySelector("#package-button"),
  packageCard: document.querySelector("#package-card"),
  packageCommand: document.querySelector("#package-command"),
  packageFile: document.querySelector("#package-file"),
  packageStatus: document.querySelector("#package-status"),
  pdfInput: document.querySelector("#pdf-input"),
  pipelineList: document.querySelector("#pipeline-list"),
  pipelineStatePill: document.querySelector("#pipeline-state-pill"),
  runtimeInput: document.querySelector("#runtime-input"),
  sceneCountPill: document.querySelector("#scene-count-pill"),
  sceneRail: document.querySelector("#scene-rail"),
  selectedFileCard: document.querySelector("#selected-file-card"),
  selectedFileMeta: document.querySelector("#selected-file-meta"),
  selectedFileName: document.querySelector("#selected-file-name"),
  serverCapabilities: document.querySelector("#server-capabilities"),
  summaryBlock: document.querySelector("#summary-block"),
  videoLink: document.querySelector("#video-link"),
  videoPanel: document.querySelector("#video-panel"),
  videoPreview: document.querySelector("#video-preview"),
  voiceInput: document.querySelector("#voice-input"),
  warningCard: document.querySelector("#warning-card"),
  warningCopy: document.querySelector("#warning-copy"),
};

const tabButtons = [...document.querySelectorAll(".tab-button")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];

const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected PDF."));
    reader.onload = () => {
      const value = String(reader.result || "");
      const base64 = value.includes(",") ? value.split(",")[1] : value;
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

const renderPipeline = (activeIndex = -1, isComplete = false) => {
  refs.pipelineList.innerHTML = "";

  pipelineSteps.forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "pipeline-item";
    if (isComplete || index < activeIndex) {
      item.classList.add("complete");
    } else if (index === activeIndex) {
      item.classList.add("active");
    }

    const bullet = document.createElement("span");
    bullet.className = "pipeline-bullet";

    const copy = document.createElement("div");
    const title = document.createElement("div");
    title.className = "pipeline-title";
    title.textContent = step.title;

    const body = document.createElement("div");
    body.className = "pipeline-copy";
    body.textContent = step.copy;

    copy.append(title, body);
    item.append(bullet, copy);
    refs.pipelineList.append(item);
  });
};

const setBusyState = (busy, label = "Idle") => {
  refs.analyzeButton.disabled = busy;
  refs.analyzeSampleButton.disabled = busy;
  refs.packageButton.disabled = busy || !state.result;
  refs.pipelineStatePill.textContent = label;
};

const setWarning = (messages = []) => {
  if (!messages || messages.length === 0) {
    refs.warningCard.hidden = true;
    refs.warningCopy.textContent = "";
    return;
  }

  refs.warningCard.hidden = false;
  refs.warningCopy.textContent = messages.join(" ");
};

const setSelectedFile = (file) => {
  state.file = file;
  if (!file) {
    refs.selectedFileCard.hidden = true;
    return;
  }

  refs.selectedFileCard.hidden = false;
  refs.selectedFileName.textContent = file.name;
  refs.selectedFileMeta.textContent = `${formatFileSize(file.size)} | ${file.type || "application/pdf"}`;
};

const collectSettings = () => ({
  audience: "Ages 12-15",
  language: "English",
  tone: "Playful classroom adventure",
  visualWorld: "Bold science lab storyboard",
  runtimeMinutes: Number(refs.runtimeInput.value),
  voiceStyle: refs.voiceInput.value,
  generateAudio: true,
  useAi: true,
});

const renderMetrics = (result) => {
  const sceneCount = result.blueprint.scenes.length;
  const metrics = [
    {
      label: "Source title",
      value: result.source.title,
      detail: result.source.fileName,
    },
    {
      label: "Pages",
      value: String(result.source.pageCount),
      detail: `${result.source.wordCount.toLocaleString()} extracted words`,
    },
    {
      label: "Scenes",
      value: String(sceneCount),
      detail: `${result.blueprint.remotionPlan.sceneCount} structured lesson blocks`,
    },
    {
      label: "Mode",
      value: result.analysisMode === "ai" ? "AI" : "Mock",
      detail:
        result.analysisMode === "ai"
          ? "AI structured the scenes"
          : "Local fallback was used",
    },
  ];

  refs.metricsGrid.innerHTML = "";
  for (const metric of metrics) {
    const card = document.createElement("article");
    card.className = "metric-card";
    card.innerHTML = `
      <span class="metric-label">${escapeHtml(metric.label)}</span>
      <strong class="metric-value">${escapeHtml(metric.value)}</strong>
      <span class="metric-detail">${escapeHtml(metric.detail)}</span>
    `;
    refs.metricsGrid.append(card);
  }
};

const renderScenes = (result) => {
  refs.sceneRail.innerHTML = "";
  refs.sceneCountPill.textContent = `${result.blueprint.scenes.length} scenes`;

  result.blueprint.scenes.forEach((scene, index) => {
    const article = document.createElement("article");
    article.className = "scene-card";

    const tags = scene.keyTerms
      .slice(0, 5)
      .map((term) => `<span class="tag">${escapeHtml(term)}</span>`)
      .join("");

    article.innerHTML = `
      <div class="scene-index">
        <strong>${String(index + 1).padStart(2, "0")}</strong>
        <span>${scene.durationSeconds}s</span>
      </div>
      <div>
        <div class="scene-title">${escapeHtml(scene.title)}</div>
        <div class="scene-meta">${escapeHtml(scene.template)} | ${escapeHtml(scene.sourceAnchor)}</div>
        <div class="scene-copy">${escapeHtml(scene.goal)}</div>
        <div class="tag-list">${tags}</div>
      </div>
    `;

    refs.sceneRail.append(article);
  });
};

const renderSummary = (result) => {
  refs.hookCopy.textContent = result.blueprint.hook;
  refs.summaryBlock.textContent = result.blueprint.summary;
  refs.goalList.innerHTML = "";

  result.blueprint.learningGoals.forEach((goal) => {
    const item = document.createElement("li");
    item.textContent = goal;
    refs.goalList.append(item);
  });
};

const renderNarration = (result) => {
  refs.narrationList.innerHTML = "";

  result.blueprint.scenes.forEach((scene) => {
    const article = document.createElement("article");
    article.className = "narration-item";
    article.innerHTML = `
      <h3>${escapeHtml(scene.title)}</h3>
      <p>${escapeHtml(scene.narration)}</p>
    `;
    refs.narrationList.append(article);
  });
};

const renderJson = (result) => {
  refs.jsonEditor.value = JSON.stringify(result.blueprint, null, 2);
};

const resetPackageCard = () => {
  state.packageResult = null;
  refs.packageCard.hidden = true;
  refs.packageStatus.textContent = "";
  refs.packageFile.textContent = "";
  refs.packageCommand.textContent = "";
  refs.videoPanel.hidden = true;
  refs.videoPreview.pause();
  refs.videoPreview.removeAttribute("src");
  refs.videoPreview.load();
  refs.videoLink.href = "#";
};

const renderBlueprint = (result) => {
  state.result = result;
  renderMetrics(result);
  renderScenes(result);
  renderSummary(result);
  renderNarration(result);
  renderJson(result);
  resetPackageCard();
  refs.downloadJsonButton.disabled = false;
  refs.copyJsonButton.disabled = false;
  refs.packageButton.disabled = false;
};

const getReviewedBlueprint = () => {
  try {
    return JSON.parse(refs.jsonEditor.value);
  } catch (error) {
    throw new Error("The edited JSON is invalid. Please fix it before generating the video.");
  }
};

const renderPackageResult = (result) => {
  state.packageResult = result;
  renderPipeline(pipelineSteps.length, true);
  refs.pipelineStatePill.textContent = "Ready";
  refs.packageCard.hidden = false;
  refs.packageStatus.textContent = `Video ready. ${result.audioGeneratedCount} AI voice clips generated.`;
  refs.packageFile.textContent = `Video: ${result.videoFile}`;
  refs.packageCommand.textContent = result.renderCommand;
  refs.videoPanel.hidden = false;
  refs.videoPreview.src = `${result.videoUrl}?t=${Date.now()}`;
  refs.videoPreview.load();
  refs.videoLink.href = result.videoUrl;
};

const setConnectionState = (health) => {
  state.health = health;
  refs.connectionChip.textContent = health.hasOpenAIKey
    ? `AI connected | ${health.model}`
    : "Mock mode | add OPENAI_API_KEY";

  refs.serverCapabilities.textContent = health.hasOpenAIKey
    ? `PDF extraction, scene structuring, AI voice, and Remotion rendering are available. Voice model: ${health.ttsModel}.`
    : "PDF extraction is available. Add OPENAI_API_KEY to enable AI scene structuring and voice generation.";

  refs.analysisModeNote.textContent = health.hasOpenAIKey
    ? "Analyze first, then edit the JSON if needed before generating the video."
    : "The fallback blueprint still works, but AI analysis and AI voices need OPENAI_API_KEY.";
};

const startPipelineAnimation = () => {
  let activeIndex = 0;
  renderPipeline(activeIndex, false);
  refs.pipelineStatePill.textContent = "Working";

  state.pipelineInterval = window.setInterval(() => {
    activeIndex = Math.min(activeIndex + 1, pipelineSteps.length - 1);
    renderPipeline(activeIndex, false);
  }, 900);
};

const stopPipelineAnimation = (success = true) => {
  if (state.pipelineInterval) {
    window.clearInterval(state.pipelineInterval);
    state.pipelineInterval = null;
  }

  renderPipeline(success ? pipelineSteps.length : -1, success);
  refs.pipelineStatePill.textContent = success ? "Ready" : "Error";
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Server request failed.");
  }
  return payload;
};

const runAnalysis = async ({sample = false} = {}) => {
  if (!sample && !state.file) {
    setWarning(["Choose a PDF first, or use the bundled sample button."]);
    return;
  }

  setWarning([]);
  setBusyState(true, "Working");
  startPipelineAnimation();

  try {
    const settings = collectSettings();
    const payload = sample
      ? {sampleFile: "jesc103.pdf", settings}
      : {
          fileName: state.file.name,
          base64: await readFileAsBase64(state.file),
          settings,
        };

    const result = await fetchJson("/api/analyze", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    stopPipelineAnimation(true);
    renderBlueprint(result);
    setWarning(result.warnings || []);
  } catch (error) {
    stopPipelineAnimation(false);
    setWarning([error instanceof Error ? error.message : "Unexpected analysis error."]);
  } finally {
    setBusyState(false, refs.pipelineStatePill.textContent);
  }
};

const runPackaging = async () => {
  if (!state.result) {
    setWarning(["Run analysis first so there is something to turn into video."]);
    return;
  }

  setWarning([]);
  renderPipeline(4, false);
  setBusyState(true, "Rendering");

  try {
    const blueprint = getReviewedBlueprint();
    const result = await fetchJson("/api/render", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        blueprint,
        source: state.result.source,
        settings: collectSettings(),
      }),
    });

    renderPackageResult(result);
    setWarning(result.warnings || []);
  } catch (error) {
    refs.pipelineStatePill.textContent = "Error";
    setWarning([error instanceof Error ? error.message : "Unexpected render error."]);
  } finally {
    setBusyState(false, refs.pipelineStatePill.textContent);
  }
};

const activateTab = (tabName) => {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });
};

const bindTabs = () => {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
};

const bindUploadEvents = () => {
  refs.pdfInput.addEventListener("change", (event) => {
    const input = event.currentTarget;
    const [file] = input.files || [];
    setSelectedFile(file || null);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    refs.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      refs.dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    refs.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      refs.dropzone.classList.remove("is-dragging");
    });
  });

  refs.dropzone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer?.files || [];
    if (file) {
      refs.pdfInput.files = event.dataTransfer.files;
      setSelectedFile(file);
    }
  });
};

const bindActionButtons = () => {
  refs.analyzeButton.addEventListener("click", () => void runAnalysis({sample: false}));
  refs.analyzeSampleButton.addEventListener("click", () => void runAnalysis({sample: true}));
  refs.packageButton.addEventListener("click", () => void runPackaging());

  refs.downloadJsonButton.addEventListener("click", () => {
    if (!refs.jsonEditor.value.trim()) {
      return;
    }

    const blob = new Blob([refs.jsonEditor.value], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(state.result?.source?.fileName || "lesson").replace(/\.pdf$/i, "")}-blueprint.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  refs.copyJsonButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(refs.jsonEditor.value);
    refs.copyJsonButton.textContent = "Copied";
    window.setTimeout(() => {
      refs.copyJsonButton.textContent = "Copy JSON";
    }, 1200);
  });
};

const boot = async () => {
  renderPipeline();
  bindTabs();
  bindUploadEvents();
  bindActionButtons();

  try {
    const health = await fetchJson("/api/health");
    setConnectionState(health);
  } catch (error) {
    refs.connectionChip.textContent = "Server unavailable";
    refs.serverCapabilities.textContent =
      "The MVP server is not running yet. Start it with `npm run mvp:dev`.";
  }
};

void boot();
