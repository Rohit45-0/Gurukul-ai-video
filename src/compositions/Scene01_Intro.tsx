import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { ChapterFrame } from "../components/ChapterFrame";
import { theme } from "../styles/theme";

const elements = [
  { symbol: "Na", type: "Metal", color: theme.colors.indigo },
  { symbol: "Fe", type: "Metal", color: theme.colors.indigo },
  { symbol: "Cu", type: "Metal", color: theme.colors.indigo },
  { symbol: "Au", type: "Metal", color: theme.colors.indigo },
  { symbol: "O", type: "Non-metal", color: theme.colors.amber },
  { symbol: "N", type: "Non-metal", color: theme.colors.amber },
  { symbol: "C", type: "Non-metal", color: theme.colors.amber },
  { symbol: "S", type: "Non-metal", color: theme.colors.amber },
  { symbol: "Ar", type: "Noble gas", color: theme.colors.teal },
  { symbol: "Si", type: "Metalloid", color: theme.colors.rose },
  { symbol: "Mg", type: "Metal", color: theme.colors.indigo },
  { symbol: "Zn", type: "Metal", color: theme.colors.indigo },
];

const positions = [
  { left: 1120, top: 60 },
  { left: 1270, top: 60 },
  { left: 1420, top: 60 },
  { left: 1570, top: 60 },
  { left: 1120, top: 220 },
  { left: 1270, top: 220 },
  { left: 1420, top: 220 },
  { left: 1570, top: 220 },
  { left: 1120, top: 380 },
  { left: 1270, top: 380 },
  { left: 1420, top: 380 },
  { left: 1570, top: 380 },
];

export const Scene01Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titlePop = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const rocket = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  return (
    <ChapterFrame
      eyebrow="Opening"
      title="Metals and Non-metals"
      subtitle="A motion-first science lesson built from the NCERT Class 10 chapter."
      accent={theme.colors.indigo}
      progress={0.08}
      footer="We begin with what children notice first: shine, strength, wires, reactions and rust."
      contentStyle={{ overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 24,
          width: 920,
          transform: `translateY(${(1 - titlePop) * 80}px)`,
          opacity: titlePop,
        }}
      >
        <AnimatedText
          text="Why do bells ring, wires glow and iron rust?"
          fontSize={64}
          color={theme.colors.yellow}
          letterSpeed={1.4}
          style={{
            fontFamily: theme.fonts.heading,
            lineHeight: 1.05,
          }}
        />
        <div
          style={{
            marginTop: 26,
            borderRadius: theme.radii.xl,
            width: 760,
            padding: "26px 30px",
            background: "rgba(8,20,38,0.66)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: theme.shadows.soft,
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 28,
              lineHeight: 1.5,
              color: theme.colors.text,
            }}
          >
            This demo turns the chapter into a playful guided video using only
            React, TypeScript, SVG and frame-based Remotion animation.
          </div>
        </div>
      </div>

      {elements.map((element, index) => {
        const position = positions[index];
        const wobble = Math.sin(frame / 18 + index) * 5;
        const cardPop = spring({
          frame: frame - 18 - index * 3,
          fps,
          config: { damping: 15, stiffness: 135 },
        });

        return (
          <div
            key={element.symbol}
            style={{
              position: "absolute",
              left: position.left,
              top: position.top + wobble,
              width: 126,
              height: 126,
              borderRadius: 26,
              padding: "16px 18px",
              background: `${element.color}22`,
              border: `2px solid ${element.color}`,
              boxShadow: `0 14px 40px ${element.color}22`,
              transform: `scale(${cardPop}) rotate(${(frame * 0.15 + index * 2) % 6 - 3}deg)`,
              opacity: cardPop,
            }}
          >
            <div
              style={{
                color: theme.colors.white,
                fontFamily: theme.fonts.heading,
                fontSize: 40,
              }}
            >
              {element.symbol}
            </div>
            <div
              style={{
                marginTop: 10,
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
                fontSize: 16,
                lineHeight: 1.2,
              }}
            >
              {element.type}
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 120,
          bottom: 56,
          borderRadius: 999,
          padding: "18px 28px",
          background: "rgba(255,191,82,0.16)",
          border: `1px solid ${theme.colors.amber}`,
          color: theme.colors.white,
          fontFamily: theme.fonts.heading,
          fontSize: 34,
          transform: `scale(${rocket})`,
          opacity: rocket,
        }}
      >
        Let's explore the chapter like a lab adventure.
      </div>
    </ChapterFrame>
  );
};
