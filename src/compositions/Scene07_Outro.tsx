import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChapterFrame } from "../components/ChapterFrame";
import { theme } from "../styles/theme";

const summaryCards = [
  "Metals are lustrous, malleable, ductile and usually good conductors.",
  "Non-metals often show opposite properties, with a few memorable exceptions.",
  "Reactivity explains reactions with oxygen, water, acids and salt solutions.",
  "Ionic compounds form by electron transfer and have strong electrostatic attraction.",
];

export const Scene07Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titlePop = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 130 },
  });

  return (
    <ChapterFrame
      eyebrow="Wrap-up"
      title="A full kid-friendly chapter video is absolutely possible"
      subtitle="This short build proves the approach: textbook content plus motion design can become a memorable learning experience."
      accent={theme.colors.yellow}
      progress={1}
      footer="Next step would be voiceover, pacing polish, and filling the remaining chapter beats into a full 5 to 6 minute cut."
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 40,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 24,
        }}
      >
        {summaryCards.map((card, index) => {
          const pop = spring({
            frame: frame - 12 - index * 8,
            fps,
            config: { damping: 15, stiffness: 120 },
          });
          const accent = [
            theme.colors.indigo,
            theme.colors.amber,
            theme.colors.coral,
            theme.colors.teal,
          ][index];

          return (
            <div
              key={card}
              style={{
                minHeight: 180,
                borderRadius: 30,
                padding: "24px 28px",
                background: `${accent}18`,
                border: `1px solid ${accent}`,
                transform: `translateY(${(1 - pop) * 24}px) scale(${0.96 + pop * 0.04})`,
                opacity: pop,
              }}
            >
              <div
                style={{
                  color: theme.colors.white,
                  fontFamily: theme.fonts.body,
                  fontSize: 30,
                  lineHeight: 1.36,
                }}
              >
                {card}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 80,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            borderRadius: 999,
            padding: "18px 34px",
            background: "rgba(255,224,129,0.18)",
            border: `1px solid ${theme.colors.yellow}`,
            color: theme.colors.white,
            fontFamily: theme.fonts.heading,
            fontSize: 42,
            transform: `scale(${titlePop})`,
          }}
        >
          Demo complete. Full production is the natural next step.
        </div>
      </div>
    </ChapterFrame>
  );
};
