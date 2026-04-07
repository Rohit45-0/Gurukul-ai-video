import { Audio, Composition, staticFile } from "remotion";
import { DEMO_TOTAL_DURATION, FullVideo, demoDurations } from "./FullVideo";
import { Scene04Reactivity } from "./compositions/Scene04_Reactivity";
import { Scene05IonicBond } from "./compositions/Scene05_IonicBond";
import {
  AutoLessonVideo,
  getAutoLessonDuration,
  sampleAutoLessonPackage,
  type AutoLessonPackage,
} from "./mvp/AutoLessonVideo";

const Scene04ReactivityPreview: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("audio/scene04-reactivity.wav")} volume={0.95} />
      <Scene04Reactivity />
    </>
  );
};

const Scene05IonicBondPreview: React.FC = () => {
  return (
    <>
      <Audio src={staticFile("audio/scene05-ionic.wav")} volume={0.95} />
      <Scene05IonicBond />
    </>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MetalsAndNonMetalsDemo"
        component={FullVideo}
        durationInFrames={DEMO_TOTAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BookAutoMvp"
        component={AutoLessonVideo}
        defaultProps={sampleAutoLessonPackage}
        durationInFrames={getAutoLessonDuration(sampleAutoLessonPackage)}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={({ props }) => {
          const pkg = props as AutoLessonPackage;
          return {
            durationInFrames: getAutoLessonDuration(pkg),
            fps: pkg.fps ?? 30,
            width: pkg.width ?? 1920,
            height: pkg.height ?? 1080,
          };
        }}
      />
      <Composition
        id="Scene04Reactivity"
        component={Scene04ReactivityPreview}
        durationInFrames={demoDurations.reactivity}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene05IonicBond"
        component={Scene05IonicBondPreview}
        durationInFrames={demoDurations.ionic}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
