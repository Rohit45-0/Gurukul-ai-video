import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { reactivitySeries } from "../data/chapterContent";
import { theme } from "../styles/theme";

type ReactivityLadderProps = {
  readonly startFrame?: number;
};

const getBarColor = (score: number, isReference?: boolean) => {
  if (isReference) {
    return "rgba(194,211,234,0.55)";
  }

  if (score >= 75) {
    return theme.colors.red;
  }

  if (score >= 40) {
    return theme.colors.amber;
  }

  return theme.colors.green;
};

export const ReactivityLadder = ({ startFrame = 0 }: ReactivityLadderProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: 760,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          color: theme.colors.red,
          fontSize: 22,
          letterSpacing: 0.8,
        }}
      >
        Most reactive
      </div>
      {reactivitySeries.map((metal, index) => {
        const appear = spring({
          frame: frame - startFrame - index * 6,
          fps,
          config: { damping: 15, stiffness: 120 },
        });
        const color = getBarColor(metal.score, metal.isReference);

        return (
          <div
            key={metal.symbol}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              transform: `translateX(${(1 - appear) * -34}px)`,
              opacity: appear,
            }}
          >
            <div
              style={{
                width: 58,
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: 28,
                textAlign: "right",
              }}
            >
              {metal.symbol}
            </div>
            <div
              style={{
                width: Math.max(180, metal.score * 5.3 * appear),
                height: 38,
                borderRadius: 999,
                background: color,
                display: "flex",
                alignItems: "center",
                paddingLeft: 16,
                color: metal.isReference ? theme.colors.background : theme.colors.white,
                fontFamily: theme.fonts.body,
                fontSize: 20,
                boxShadow: `0 12px 26px ${color}26`,
              }}
            >
              {metal.name}
            </div>
          </div>
        );
      })}
      <div
        style={{
          fontFamily: theme.fonts.heading,
          color: theme.colors.green,
          fontSize: 22,
          letterSpacing: 0.8,
        }}
      >
        Least reactive
      </div>
    </div>
  );
};
