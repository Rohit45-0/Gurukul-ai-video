import { useCurrentFrame } from "remotion";
import { theme } from "../styles/theme";

type AtomModelProps = {
  readonly symbol: string;
  readonly shells: number[];
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly highlightOuter?: boolean;
  readonly outerAccent?: string;
};

export const AtomModel = ({
  symbol,
  shells,
  x,
  y,
  size = 240,
  highlightOuter = false,
  outerAccent = theme.colors.blue,
}: AtomModelProps) => {
  const frame = useCurrentFrame();
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      style={{ position: "absolute", left: x, top: y, overflow: "visible" }}
    >
      <circle
        cx={center}
        cy={center}
        r={size * 0.16}
        fill={theme.colors.coral}
        style={{ filter: "drop-shadow(0 0 22px rgba(255,125,103,0.45))" }}
      />
      <text
        x={center}
        y={center + 10}
        textAnchor="middle"
        fill={theme.colors.white}
        fontSize={size * 0.19}
        fontWeight={700}
        fontFamily={theme.fonts.heading}
      >
        {symbol}
      </text>

      {shells.map((count, shellIndex) => {
        const radius = size * (0.27 + shellIndex * 0.15);
        const speed = 0.028 - shellIndex * 0.005;
        const isOuter = shellIndex === shells.length - 1;

        return (
          <g key={`${symbol}-shell-${shellIndex}`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={isOuter ? `${outerAccent}88` : "rgba(194,211,234,0.24)"}
              strokeWidth={isOuter ? 2.5 : 1.5}
              strokeDasharray={isOuter ? "7 6" : undefined}
            />
            {Array.from({ length: count }).map((_, electronIndex) => {
              const angle =
                (Math.PI * 2 * electronIndex) / count +
                frame * speed * (shellIndex % 2 === 0 ? 1 : -1);
              const electronX = center + Math.cos(angle) * radius;
              const electronY = center + Math.sin(angle) * radius;
              const highlighted = isOuter && highlightOuter;

              return (
                <circle
                  key={`${symbol}-${shellIndex}-${electronIndex}`}
                  cx={electronX}
                  cy={electronY}
                  r={highlighted ? 7.5 : 5.6}
                  fill={highlighted ? outerAccent : theme.colors.indigo}
                  style={{
                    filter: highlighted
                      ? "drop-shadow(0 0 12px rgba(118,198,255,0.95))"
                      : "drop-shadow(0 0 5px rgba(111,134,255,0.45))",
                  }}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};
