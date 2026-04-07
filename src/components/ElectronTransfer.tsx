import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AtomModel } from "./AtomModel";
import { panelGradient, theme } from "../styles/theme";

type ElectronTransferProps = {
  readonly startFrame?: number;
};

export const ElectronTransfer = ({ startFrame = 0 }: ElectronTransferProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - startFrame);
  const progress = interpolate(localFrame, [56, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ionLabel = spring({
    frame: localFrame - 104,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const crystal = spring({
    frame: localFrame - 136,
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const electronVisible = localFrame >= 52 && localFrame <= 110;
  const electronX = 440 + progress * 620;
  const electronY = 420 - Math.sin(progress * Math.PI) * 120;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <AtomModel symbol="Na" shells={[2, 8, 1]} x={100} y={120} highlightOuter size={330} />
      <AtomModel symbol="Cl" shells={[2, 8, 7]} x={1040} y={120} size={330} />

      <svg
        width={1920}
        height={720}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <path
          d="M 455 420 C 650 260, 865 260, 1060 420"
          stroke="rgba(118,198,255,0.22)"
          strokeWidth={5}
          fill="none"
          strokeDasharray="14 12"
        />
        {electronVisible ? (
          <circle
            cx={electronX}
            cy={electronY}
            r={12}
            fill={theme.colors.blue}
            style={{ filter: "drop-shadow(0 0 18px rgba(118,198,255,1))" }}
          />
        ) : null}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 100,
          top: 520,
          width: 360,
          borderRadius: theme.radii.lg,
          padding: "18px 22px",
          background: panelGradient,
          border: `1px solid ${theme.colors.indigo}99`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.text,
            fontSize: 30,
          }}
        >
          Sodium
        </div>
        <div
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: 22,
            marginTop: 6,
          }}
        >
          2,8,1 wants to lose one outer electron.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 100,
          top: 520,
          width: 360,
          borderRadius: theme.radii.lg,
          padding: "18px 22px",
          background: panelGradient,
          border: `1px solid ${theme.colors.teal}99`,
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.text,
            fontSize: 30,
          }}
        >
          Chlorine
        </div>
        <div
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: 22,
            marginTop: 6,
          }}
        >
          2,8,7 wants one electron to complete its octet.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 178,
          top: 622,
          color: theme.colors.amber,
          fontSize: 42,
          fontFamily: theme.fonts.heading,
          transform: `scale(${ionLabel})`,
          transformOrigin: "left center",
          opacity: ionLabel,
        }}
      >
        Na+
      </div>
      <div
        style={{
          position: "absolute",
          right: 220,
          top: 622,
          color: theme.colors.blue,
          fontSize: 42,
          fontFamily: theme.fonts.heading,
          transform: `scale(${ionLabel})`,
          transformOrigin: "right center",
          opacity: ionLabel,
        }}
      >
        Cl-
      </div>

      <div
        style={{
          position: "absolute",
          left: 50,
          right: 50,
          bottom: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          opacity: crystal,
          transform: `translateY(${(1 - crystal) * 30}px)`,
        }}
      >
        <div
          style={{
            borderRadius: 999,
            padding: "14px 28px",
            background: "rgba(68,214,180,0.16)",
            border: `1px solid ${theme.colors.teal}`,
            color: theme.colors.white,
            fontFamily: theme.fonts.heading,
            fontSize: 34,
          }}
        >
          Opposite charges attract
        </div>
        <div
          style={{
            borderRadius: 999,
            padding: "14px 28px",
            background: "rgba(255,191,82,0.18)",
            border: `1px solid ${theme.colors.amber}`,
            color: theme.colors.white,
            fontFamily: theme.fonts.heading,
            fontSize: 34,
          }}
        >
          NaCl forms an ionic compound
        </div>
      </div>
    </div>
  );
};
