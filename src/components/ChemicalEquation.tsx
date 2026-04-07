import type { CSSProperties, ReactNode } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { panelGradient, theme } from "../styles/theme";

type ChemicalEquationProps = {
  readonly equation: string;
  readonly label?: string;
  readonly startFrame?: number;
  readonly accent?: string;
  readonly style?: CSSProperties;
};

const needsSubscript = (previous: string | undefined, current: string) => {
  if (!/\d/.test(current) || !previous) {
    return false;
  }

  return /[A-Za-z)\]]/.test(previous);
};

const needsSuperscript = (
  previous: string | undefined,
  current: string,
  next: string | undefined,
) => {
  if (!["+", "-", "−"].includes(current) || !previous) {
    return false;
  }

  return /[A-Za-z0-9)\]]/.test(previous) && (!next || next === " ");
};

const renderFormula = (formula: string): ReactNode[] =>
  Array.from(formula).map((char, index, chars) => {
    const previous = chars[index - 1];
    const next = chars[index + 1];

    if (needsSubscript(previous, char)) {
      return (
        <sub key={`${char}-${index}`} style={{ fontSize: "0.62em", lineHeight: 1 }}>
          {char}
        </sub>
      );
    }

    if (needsSuperscript(previous, char, next)) {
      return (
        <sup key={`${char}-${index}`} style={{ fontSize: "0.55em", lineHeight: 1 }}>
          {char}
        </sup>
      );
    }

    return <span key={`${char}-${index}`}>{char}</span>;
  });

export const ChemicalEquation = ({
  equation,
  label,
  startFrame = 0,
  accent = theme.colors.amber,
  style,
}: ChemicalEquationProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  const parts = equation.split(/\s*(?:→|->)\s*/);
  const left = parts[0] ?? equation;
  const right = parts[1] ?? "";

  return (
    <div
      style={{
        borderRadius: theme.radii.lg,
        background: panelGradient,
        border: `1px solid ${accent}88`,
        padding: "18px 24px",
        boxShadow: `0 18px 50px ${accent}22`,
        transform: `translateY(${(1 - appear) * 22}px) scale(${0.92 + appear * 0.08})`,
        opacity: appear,
        ...style,
      }}
    >
      {label ? (
        <div
          style={{
            fontFamily: theme.fonts.body,
            color: theme.colors.textMuted,
            fontSize: 18,
            textTransform: "uppercase",
            letterSpacing: 1.1,
          }}
        >
          {label}
        </div>
      ) : null}
      <div
        style={{
          marginTop: label ? 8 : 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          fontSize: 42,
          letterSpacing: 0.2,
        }}
      >
        <span>{renderFormula(left)}</span>
        <span style={{ color: accent, fontSize: 46 }}>→</span>
        <span>{renderFormula(right)}</span>
      </div>
    </div>
  );
};
