import { useCurrentFrame } from "remotion";
import { theme } from "../styles/theme";

type BubbleEffectProps = {
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
};

export const BubbleEffect = ({
  x,
  y,
  width = 160,
  height = 220,
}: BubbleEffectProps) => {
  const frame = useCurrentFrame();

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", left: x, top: y, overflow: "visible" }}
    >
      {Array.from({ length: 9 }).map((_, index) => {
        const cycle = (frame * (1.5 + (index % 3) * 0.5) + index * 30) % height;
        const rise = height - cycle;
        const drift = Math.sin(frame * 0.04 + index * 1.3) * (8 + (index % 2) * 6);
        const opacity = Math.max(0.15, rise / height);

        return (
          <circle
            key={`bubble-${index}`}
            cx={width / 2 + drift + (index % 4) * 12 - 18}
            cy={rise}
            r={5 + (index % 3)}
            fill="none"
            stroke={theme.colors.blue}
            strokeWidth={2}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};
