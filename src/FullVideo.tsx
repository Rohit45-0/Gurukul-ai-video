import { Audio, Series, staticFile } from "remotion";
import { Scene01Intro } from "./compositions/Scene01_Intro";
import { Scene02PhysicalProperties } from "./compositions/Scene02_PhysicalProperties";
import { Scene03Comparison } from "./compositions/Scene03_Comparison";
import { Scene04Reactivity } from "./compositions/Scene04_Reactivity";
import { Scene05IonicBond } from "./compositions/Scene05_IonicBond";
import { Scene06ExtractionCorrosion } from "./compositions/Scene06_ExtractionCorrosion";
import { Scene07Outro } from "./compositions/Scene07_Outro";

export const demoDurations = {
  intro: 510,
  physical: 960,
  comparison: 810,
  reactivity: 1290,
  ionic: 1080,
  extractionCorrosion: 1110,
  outro: 600,
} as const;

export const DEMO_TOTAL_DURATION = Object.values(demoDurations).reduce(
  (sum, duration) => sum + duration,
  0,
);

export const FullVideo = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={demoDurations.intro}>
        <Audio src={staticFile("audio/scene01-intro.wav")} volume={0.95} />
        <Scene01Intro />
      </Series.Sequence>
      <Series.Sequence durationInFrames={demoDurations.physical}>
        <Audio src={staticFile("audio/scene02-physical.wav")} volume={0.95} />
        <Scene02PhysicalProperties />
      </Series.Sequence>
      <Series.Sequence durationInFrames={demoDurations.comparison}>
        <Audio src={staticFile("audio/scene03-comparison.wav")} volume={0.95} />
        <Scene03Comparison />
      </Series.Sequence>
      <Series.Sequence durationInFrames={demoDurations.reactivity}>
        <Audio src={staticFile("audio/scene04-reactivity.wav")} volume={0.95} />
        <Scene04Reactivity />
      </Series.Sequence>
      <Series.Sequence durationInFrames={demoDurations.ionic}>
        <Audio src={staticFile("audio/scene05-ionic.wav")} volume={0.95} />
        <Scene05IonicBond />
      </Series.Sequence>
      <Series.Sequence durationInFrames={demoDurations.extractionCorrosion}>
        <Audio
          src={staticFile("audio/scene06-extraction-corrosion.wav")}
          volume={0.95}
        />
        <Scene06ExtractionCorrosion />
      </Series.Sequence>
      <Series.Sequence durationInFrames={demoDurations.outro}>
        <Audio src={staticFile("audio/scene07-outro.wav")} volume={0.95} />
        <Scene07Outro />
      </Series.Sequence>
    </Series>
  );
};
