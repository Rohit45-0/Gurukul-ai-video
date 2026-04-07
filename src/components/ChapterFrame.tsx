import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../styles/theme";

type ChapterFrameProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly accent?: string;
  readonly progress?: number;
  readonly footer?: string;
  readonly children: ReactNode;
  readonly contentStyle?: CSSProperties;
};

export const ChapterFrame = ({
  eyebrow,
  title,
  subtitle,
  accent = theme.colors.indigo,
  progress = 0,
  footer,
  children,
  contentStyle,
}: ChapterFrameProps) => {
  const frame = useCurrentFrame();
  const floatA = Math.sin(frame / 32) * 22;
  const floatB = Math.cos(frame / 46) * 18;
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      <AbsoluteFill
        style={{
          backgroundImage: `
            radial-gradient(circle at 14% 18%, ${accent}44 0%, transparent 28%),
            radial-gradient(circle at 84% 14%, rgba(255,191,82,0.18) 0%, transparent 22%),
            radial-gradient(circle at 76% 84%, rgba(68,214,180,0.18) 0%, transparent 20%),
            linear-gradient(180deg, #0a1630 0%, #07111f 100%)
          `,
        }}
      />
      <AbsoluteFill>
        <svg width={1920} height={1080} style={{ opacity: 0.46 }}>
          <defs>
            <linearGradient id="line-glow" x1="0" x2="1">
              <stop offset="0%" stopColor={`${accent}00`} />
              <stop offset="50%" stopColor={`${accent}88`} />
              <stop offset="100%" stopColor={`${accent}00`} />
            </linearGradient>
          </defs>
          {Array.from({ length: 8 }).map((_, index) => {
            const y = 120 + index * 110 + ((index % 2) * 22);
            return (
              <line
                key={`h-${index}`}
                x1={0}
                y1={y}
                x2={1920}
                y2={y}
                stroke="url(#line-glow)"
                strokeWidth={1}
              />
            );
          })}
          {Array.from({ length: 10 }).map((_, index) => {
            const x = 100 + index * 170;
            return (
              <line
                key={`v-${index}`}
                x1={x}
                y1={0}
                x2={x}
                y2={1080}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={1}
              />
            );
          })}
          <circle
            cx={280 + floatA}
            cy={170 + floatB}
            r={18}
            fill="rgba(255,255,255,0.08)"
          />
          <circle
            cx={1680 - floatB}
            cy={860 + floatA}
            r={24}
            fill={`${accent}33`}
          />
          <circle cx={1540} cy={220} r={8} fill="rgba(255,255,255,0.18)" />
          <circle cx={1610} cy={250} r={5} fill="rgba(255,255,255,0.14)" />
          <line
            x1={1540}
            y1={220}
            x2={1610}
            y2={250}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={2}
          />
        </svg>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "64px 72px 42px",
          display: "flex",
          flexDirection: "column",
          color: theme.colors.text,
        }}
      >
        <div
          style={{
            opacity: headerOpacity,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 999,
                padding: "10px 18px",
                border: `1px solid ${accent}`,
                background: "rgba(8, 20, 38, 0.58)",
                boxShadow: theme.shadows.soft,
                fontFamily: theme.fonts.heading,
                fontSize: 22,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: accent,
                }}
              />
              {eyebrow}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 74,
                lineHeight: 1.02,
                letterSpacing: 0.2,
                marginTop: 22,
                maxWidth: 1000,
                textShadow: "0 12px 30px rgba(0,0,0,0.28)",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  marginTop: 12,
                  maxWidth: 900,
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                  fontSize: 30,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div
            style={{
              borderRadius: 28,
              padding: "18px 22px",
              background: "rgba(8, 20, 38, 0.72)",
              border: "1px solid rgba(255,255,255,0.12)",
              minWidth: 250,
              boxShadow: theme.shadows.soft,
            }}
          >
            <div
              style={{
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
                fontSize: 18,
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              Lesson
            </div>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 34,
                marginTop: 6,
              }}
            >
              Class 10 Science
            </div>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 22,
                color: theme.colors.textMuted,
                marginTop: 6,
              }}
            >
              NCERT Chapter 3
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            flex: 1,
            marginTop: 24,
            ...contentStyle,
          }}
        >
          {children}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 360,
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(0.06, Math.min(progress, 1)) * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${accent} 0%, ${theme.colors.amber} 100%)`,
              }}
            />
          </div>
          <div
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
              fontSize: 22,
            }}
          >
            {footer ?? "Playful concept demo generated from the textbook chapter."}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
