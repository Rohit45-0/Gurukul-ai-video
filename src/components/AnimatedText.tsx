import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../styles/theme";

type AnimatedTextProps = {
  readonly text: string;
  readonly startFrame?: number;
  readonly color?: string;
  readonly fontSize?: number;
  readonly style?: CSSProperties;
  readonly letterSpeed?: number;
};

export const AnimatedText = ({
  text,
  startFrame = 0,
  color = theme.colors.text,
  fontSize = 36,
  style,
  letterSpeed = 1.7,
}: AnimatedTextProps) => {
  const frame = useCurrentFrame();
  const visible = Math.floor(
    interpolate(
      frame,
      [startFrame, startFrame + text.length * letterSpeed],
      [0, text.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );

  return (
    <div
      style={{
        color,
        fontSize,
        fontFamily: theme.fonts.body,
        lineHeight: 1.3,
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {text.slice(0, visible)}
      {visible < text.length ? (
        <span style={{ opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0 }}>|</span>
      ) : null}
    </div>
  );
};
