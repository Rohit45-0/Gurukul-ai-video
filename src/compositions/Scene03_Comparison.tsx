import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { ChapterFrame } from "../components/ChapterFrame";
import { comparisonRows, exceptionFacts } from "../data/chapterContent";
import { panelGradient, theme } from "../styles/theme";

export const Scene03Comparison = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <ChapterFrame
      eyebrow="Comparison"
      title="Non-metals flip many of the metal rules"
      subtitle="A side-by-side comparison helps students remember contrasts and the important exceptions."
      accent={theme.colors.teal}
      progress={0.4}
      footer="This scene is strong for recall because each row answers the same question for both groups."
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 640,
          borderRadius: 36,
          overflow: "hidden",
          background: panelGradient,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: theme.shadows.soft,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1fr",
            alignItems: "stretch",
            height: 120,
          }}
        >
          <div
            style={{
              padding: "34px 28px",
              background: "rgba(255,255,255,0.03)",
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
              fontSize: 24,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            Property
          </div>
          <div
            style={{
              padding: "34px 28px",
              background: "rgba(111,134,255,0.22)",
              color: theme.colors.white,
              fontFamily: theme.fonts.heading,
              fontSize: 34,
              boxShadow: "inset 0 -10px 40px rgba(0,0,0,0.16)",
            }}
          >
            Metals
          </div>
          <div
            style={{
              padding: "34px 28px",
              background: "rgba(255,191,82,0.24)",
              color: theme.colors.white,
              fontFamily: theme.fonts.heading,
              fontSize: 34,
              boxShadow: "inset 0 -10px 40px rgba(0,0,0,0.16)",
            }}
          >
            Non-metals
          </div>
        </div>
        {comparisonRows.map((row, index) => {
          const rowPop = spring({
            frame: frame - 18 - index * 14,
            fps,
            config: { damping: 16, stiffness: 120 },
          });

          return (
            <div
              key={row.property}
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1fr 1fr",
                minHeight: 104,
                alignItems: "center",
                padding: "0 28px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                transform: `translateX(${(1 - rowPop) * -50}px)`,
                opacity: rowPop,
              }}
            >
              <div
                style={{
                  color: theme.colors.white,
                  fontFamily: theme.fonts.heading,
                  fontSize: 30,
                }}
              >
                {row.property}
              </div>
              <div
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 24,
                  lineHeight: 1.35,
                }}
              >
                {row.metals}
              </div>
              <div
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 24,
                  lineHeight: 1.35,
                }}
              >
                {row.nonMetals}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 1120,
          top: 10,
          width: 650,
        }}
      >
        <AnimatedText
          text="But physical properties alone are not enough. The chapter keeps reminding us to watch the exceptions."
          fontSize={34}
          color={theme.colors.yellow}
          style={{ fontFamily: theme.fonts.heading, lineHeight: 1.15 }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 1120,
          top: 150,
          display: "grid",
          gap: 18,
        }}
      >
        {exceptionFacts.map((fact, index) => {
          const appear = spring({
            frame: frame - 40 - index * 16,
            fps,
            config: { damping: 14, stiffness: 120 },
          });
          const accent = [
            theme.colors.yellow,
            theme.colors.blue,
            theme.colors.coral,
            theme.colors.indigo,
          ][index];

          return (
            <div
              key={fact}
              style={{
                width: 560,
                borderRadius: 28,
                padding: "20px 24px",
                background: `${accent}20`,
                border: `1px solid ${accent}`,
                boxShadow: `0 18px 30px ${accent}18`,
                transform: `translateY(${(1 - appear) * 24}px) rotate(${(index % 2 === 0 ? -1 : 1) * (1 - appear) * 6}deg)`,
                opacity: appear,
              }}
            >
              <div
                style={{
                  color: theme.colors.white,
                  fontFamily: theme.fonts.body,
                  fontSize: 26,
                  lineHeight: 1.42,
                }}
              >
                {fact}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 1120,
          bottom: 36,
          width: 620,
          borderRadius: 28,
          padding: "22px 24px",
          background: "rgba(8,20,38,0.68)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
            fontSize: 24,
            lineHeight: 1.42,
          }}
        >
          This is exactly where animation helps. A sticky visual can spotlight
          the rare cases without making the main rule feel confusing.
        </div>
      </div>
    </ChapterFrame>
  );
};
