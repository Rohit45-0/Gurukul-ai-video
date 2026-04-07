import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { panelGradient, theme } from "../styles/theme";

type PropertyCardProps = {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly detail?: string;
  readonly accent?: string;
  readonly index: number;
  readonly startFrame?: number;
  readonly width?: number;
};

export const PropertyCard = ({
  icon,
  title,
  description,
  detail,
  accent = theme.colors.indigo,
  index,
  startFrame = 0,
  width = 292,
}: PropertyCardProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({
    frame: frame - startFrame - index * 12,
    fps,
    config: {
      damping: 14,
      stiffness: 130,
      mass: 0.9,
    },
  });

  return (
    <div
      style={{
        width,
        minHeight: 192,
        borderRadius: theme.radii.lg,
        padding: "22px 24px",
        background: panelGradient,
        border: `2px solid ${accent}`,
        boxShadow: `0 20px 45px ${accent}22`,
        transform: `translateY(${(1 - appear) * 40}px) scale(${appear})`,
        opacity: appear,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: 18,
          background: `${accent}26`,
          color: accent,
          fontFamily: theme.fonts.heading,
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          marginTop: 18,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          fontSize: 30,
          lineHeight: 1.05,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 10,
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
          fontSize: 22,
          lineHeight: 1.35,
        }}
      >
        {description}
      </div>
      {detail ? (
        <div
          style={{
            marginTop: 12,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: 18,
            lineHeight: 1.4,
          }}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
};
