import { useCurrentFrame } from "remotion";

type FlameEffectProps = {
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly outerColor?: string;
  readonly innerColor?: string;
  readonly label?: string;
};

export const FlameEffect = ({
  x,
  y,
  scale = 1,
  outerColor = "#ffbf52",
  innerColor = "#fff6d7",
  label,
}: FlameEffectProps) => {
  const frame = useCurrentFrame();
  const flicker = Math.sin(frame * 0.42) * 8;
  const flickerB = Math.sin(frame * 0.27 + 1.7) * 6;

  return (
    <svg
      width={160}
      height={220}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale})`,
        overflow: "visible",
      }}
    >
      <ellipse cx={80} cy={150 + flicker} rx={40} ry={62 + flickerB} fill={outerColor} />
      <ellipse cx={80} cy={154 + flicker / 2} rx={24} ry={40 + flickerB / 2} fill={innerColor} />
      <ellipse cx={80} cy={96 + flicker * 1.2} rx={14} ry={28} fill={innerColor} opacity={0.72} />
      {label ? (
        <text
          x={80}
          y={214}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={18}
          fontFamily='"Segoe UI", sans-serif'
          fontWeight={700}
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
};
