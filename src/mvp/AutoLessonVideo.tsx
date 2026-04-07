import React from "react";
import {
  AbsoluteFill,
  Audio,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {panelGradient, theme} from "../styles/theme";

export type AutoLessonScene = {
  id: string;
  title: string;
  template: string;
  durationInFrames: number;
  durationSeconds: number;
  goal: string;
  sourceAnchor: string;
  beats: string[];
  visuals: string[];
  narration: string;
  keyTerms: string[];
  audioPath?: string | null;
};

export type AutoLessonPackage = {
  schemaVersion: number;
  compositionId: string;
  sourceTitle: string;
  sourceFileName: string;
  hook: string;
  summary: string;
  learningGoals: string[];
  createdAt: string;
  runtimeMinutes: number;
  fps: number;
  width: number;
  height: number;
  totalDurationInFrames: number;
  totalDurationSeconds: number;
  voice: {
    provider: string;
    model: string;
    preset: string;
    instructions: string;
  };
  style: {
    tone: string;
    visualWorld: string;
    colorPalette: string[];
  };
  scenes: AutoLessonScene[];
};

const samplePalette = ["#07111f", "#132b47", "#ffbf52", "#44d6b4", "#ff7d67"];

export const sampleAutoLessonPackage: AutoLessonPackage = {
  schemaVersion: 1,
  compositionId: "BookAutoMvp",
  sourceTitle: "Metals and Non-metals",
  sourceFileName: "jesc103.pdf",
  hook: "Why do some materials shine, fizz, rust, or stay dull? Let's find out.",
  summary:
    "A short classroom-style lesson that compares metals and non-metals, shows simple reactions, and ends with recall-friendly cues.",
  learningGoals: [
    "Spot the main differences between metals and non-metals.",
    "Understand why reactivity changes from one metal to another.",
    "See how short scenes can be packaged for Remotion.",
  ],
  createdAt: new Date().toISOString(),
  runtimeMinutes: 3,
  fps: 30,
  width: 1920,
  height: 1080,
  totalDurationInFrames: 5400,
  totalDurationSeconds: 180,
  voice: {
    provider: "openai",
    model: "gpt-4o-mini-tts",
    preset: "cedar",
    instructions: "Calm, clear teacher voice.",
  },
  style: {
    tone: "Playful classroom adventure",
    visualWorld: "Bold science lab storyboard",
    colorPalette: samplePalette,
  },
  scenes: [
    {
      id: "scene-01",
      title: "Metals vs Non-metals",
      template: "comparison-board",
      durationInFrames: 900,
      durationSeconds: 30,
      goal: "Introduce the chapter and frame the central contrast.",
      sourceAnchor: "Pages 1-2",
      beats: [
        "Show common examples from daily life.",
        "Contrast shiny and dull materials.",
        "Set up the question for the rest of the lesson.",
      ],
      visuals: ["title card", "object comparison", "question card"],
      narration:
        "Metals and non-metals look and behave differently. In this lesson, we will see those differences through simple examples and reactions.",
      keyTerms: ["metals", "non-metals", "comparison"],
      audioPath: null,
    },
    {
      id: "scene-02",
      title: "Physical Properties",
      template: "concept-cards",
      durationInFrames: 1200,
      durationSeconds: 40,
      goal: "Cover lustre, malleability, ductility, and conductivity in one clear block.",
      sourceAnchor: "Pages 2-5",
      beats: [
        "Shiny surface means metallic lustre.",
        "Some metals can be beaten into sheets or wires.",
        "Conductivity makes metals useful in daily life.",
      ],
      visuals: ["property cards", "wire diagram", "bulb example"],
      narration:
        "Many metals are shiny, can be shaped into sheets, drawn into wires, and conduct heat and electricity well.",
      keyTerms: ["lustre", "ductility", "malleability", "conductivity"],
      audioPath: null,
    },
    {
      id: "scene-03",
      title: "Reactivity",
      template: "reaction-lab",
      durationInFrames: 1800,
      durationSeconds: 60,
      goal: "Show how metals react differently with oxygen, water, and acids.",
      sourceAnchor: "Pages 5-12",
      beats: [
        "Highly reactive metals need careful storage.",
        "Some reactions produce bubbles or heat.",
        "The reactivity series helps predict behavior.",
      ],
      visuals: ["lab beaker", "reaction ladder", "equation card"],
      narration:
        "Some metals react very quickly, while others react slowly or hardly at all. The reactivity series helps us compare them.",
      keyTerms: ["oxygen", "water", "acids", "reactivity series"],
      audioPath: null,
    },
    {
      id: "scene-04",
      title: "Ionic Compounds and Extraction",
      template: "diagram-explainer",
      durationInFrames: 1500,
      durationSeconds: 50,
      goal: "Wrap up with ionic bonding, extraction, and corrosion.",
      sourceAnchor: "Pages 12-21",
      beats: [
        "Metals can transfer electrons to non-metals.",
        "Different metals are extracted in different ways.",
        "Corrosion can be slowed by protection and alloying.",
      ],
      visuals: ["electron transfer", "ore flow", "rust prevention"],
      narration:
        "Metals can form ionic compounds, are extracted based on reactivity, and may corrode unless protected.",
      keyTerms: ["ionic", "extraction", "corrosion", "alloy"],
      audioPath: null,
    },
  ],
};

export const getAutoLessonDuration = (pkg: AutoLessonPackage) =>
  pkg.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);

const chipStyle = (accent: string): React.CSSProperties => ({
  border: `1px solid ${accent}55`,
  borderRadius: 999,
  padding: "10px 16px",
  color: theme.colors.text,
  background: `${accent}1a`,
  fontSize: 22,
  fontWeight: 600,
});

const SceneSlide: React.FC<{
  pkg: AutoLessonPackage;
  scene: AutoLessonScene;
  index: number;
}> = ({pkg, scene, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const accent = pkg.style.colorPalette[index % pkg.style.colorPalette.length] ?? samplePalette[2];
  const enter = spring({frame, fps, config: {damping: 14, stiffness: 120}});
  const fade = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: "clamp"});
  const drift = interpolate(frame, [0, 40], [50, 0], {extrapolateRight: "clamp"});
  const barWidth = interpolate(
    frame,
    [0, scene.durationInFrames],
    [0, 100],
    {extrapolateRight: "clamp"},
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at top right, ${accent}22, transparent 30%), ${theme.colors.background}`,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      <AbsoluteFill style={{background: panelGradient, opacity: 0.72}} />
      <AbsoluteFill style={{padding: 64, opacity: fade}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <div style={chipStyle(accent)}>{pkg.sourceTitle}</div>
          <div style={{display: "flex", gap: 12}}>
            <div style={chipStyle(theme.colors.teal)}>Scene {index + 1}</div>
            <div style={chipStyle(theme.colors.amber)}>Voice {pkg.voice.preset}</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 28,
            marginTop: 42,
            flex: 1,
            transform: `translateY(${drift}px) scale(${0.96 + enter * 0.04})`,
          }}
        >
          <div
            style={{
              background: "rgba(16,35,59,0.92)",
              borderRadius: 28,
              border: `1px solid ${accent}44`,
              padding: 34,
              boxShadow: theme.shadows.soft,
            }}
          >
            <div style={{fontSize: 22, color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.14em"}}>
              {scene.template}
            </div>
            <div style={{fontFamily: theme.fonts.heading, fontSize: 72, lineHeight: 0.98, marginTop: 16}}>
              {scene.title}
            </div>
            <div style={{marginTop: 18, fontSize: 32, lineHeight: 1.45, color: theme.colors.textMuted}}>
              {scene.goal}
            </div>
            <div
              style={{
                marginTop: 28,
                padding: 22,
                borderRadius: 22,
                background: "rgba(7,17,31,0.7)",
                border: `1px solid ${theme.colors.slate}44`,
                fontSize: 26,
                lineHeight: 1.55,
              }}
            >
              {index === 0 ? pkg.hook : scene.narration}
            </div>
          </div>

          <div style={{display: "grid", gap: 22}}>
            <div
              style={{
                background: "rgba(16,35,59,0.92)",
                borderRadius: 28,
                border: `1px solid ${theme.colors.teal}33`,
                padding: 28,
              }}
            >
              <div style={{fontSize: 24, fontWeight: 700}}>Scene beats</div>
              <div style={{display: "grid", gap: 14, marginTop: 18}}>
                {scene.beats.map((beat, beatIndex) => (
                  <div
                    key={`${scene.id}-${beatIndex}`}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.04)",
                      fontSize: 24,
                      lineHeight: 1.5,
                    }}
                  >
                    {beat}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "rgba(16,35,59,0.92)",
                borderRadius: 28,
                border: `1px solid ${theme.colors.amber}33`,
                padding: 28,
              }}
            >
              <div style={{fontSize: 24, fontWeight: 700}}>Key terms</div>
              <div style={{display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18}}>
                {scene.keyTerms.map((term) => (
                  <div
                    key={`${scene.id}-${term}`}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      background: `${accent}22`,
                      border: `1px solid ${accent}44`,
                      fontSize: 22,
                    }}
                  >
                    {term}
                  </div>
                ))}
              </div>
              <div style={{marginTop: 22, fontSize: 22, color: theme.colors.textMuted}}>
                Source: {scene.sourceAnchor}
              </div>
              <div style={{marginTop: 14, fontSize: 22, color: theme.colors.textMuted}}>
                Runtime: {scene.durationSeconds}s
              </div>
            </div>
          </div>
        </div>

        <div style={{marginTop: "auto"}}>
          <div
            style={{
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barWidth}%`,
                height: "100%",
                background: accent,
              }}
            />
          </div>
          <div style={{display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 20, color: theme.colors.textMuted}}>
            <div>{pkg.style.tone}</div>
            <div>{pkg.style.visualWorld}</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AutoLessonVideo: React.FC<AutoLessonPackage> = (pkg) => {
  return (
    <Series>
      {pkg.scenes.map((scene, index) => (
        <Series.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
          <>
            {scene.audioPath ? <Audio src={staticFile(scene.audioPath)} volume={0.95} /> : null}
            <SceneSlide pkg={pkg} scene={scene} index={index} />
          </>
        </Series.Sequence>
      ))}
    </Series>
  );
};
