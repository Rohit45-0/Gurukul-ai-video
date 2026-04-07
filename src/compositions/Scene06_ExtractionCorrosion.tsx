import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChapterFrame } from "../components/ChapterFrame";
import { ChemicalEquation } from "../components/ChemicalEquation";
import { alloyRows } from "../data/chapterContent";
import { panelGradient, theme } from "../styles/theme";

const nodePositions = {
  ore: { left: 120, top: 110 },
  concentration: { left: 120, top: 246 },
  high: { left: 120, top: 382 },
  medium: { left: 460, top: 382 },
  low: { left: 800, top: 382 },
  electrolysis: { left: 120, top: 518 },
  roasting: { left: 460, top: 518 },
  heating: { left: 800, top: 518 },
};

const FlowNode = ({
  label,
  left,
  top,
  index,
}: {
  readonly label: string;
  readonly left: number;
  readonly top: number;
  readonly index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - index * 8,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 230,
        height: 88,
        borderRadius: 24,
        background: "rgba(8,20,38,0.78)",
        border: `1px solid ${theme.colors.indigo}88`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.colors.white,
        fontFamily: theme.fonts.heading,
        fontSize: 28,
        textAlign: "center",
        transform: `scale(${pop})`,
        opacity: pop,
      }}
    >
      {label}
    </div>
  );
};

export const Scene06ExtractionCorrosion = () => {
  const frame = useCurrentFrame();

  return (
    <ChapterFrame
      eyebrow="Extraction and Corrosion"
      title="The chapter ends by asking where metals come from and how we protect them"
      subtitle="This is a compact demo version of the metallurgy flow plus the corrosion and alloy ideas that usually need stronger visuals."
      accent={theme.colors.teal}
      progress={0.94}
      footer="A full production version could comfortably stretch this topic into another 60 to 90 seconds."
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1120,
          height: 640,
          borderRadius: 38,
          background: panelGradient,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: theme.shadows.soft,
          overflow: "hidden",
        }}
      >
        <svg
          width={1120}
          height={640}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          {[
            [235, 198, 235, 246],
            [235, 334, 235, 382],
            [235, 426, 575, 426],
            [575, 426, 915, 426],
            [235, 470, 235, 518],
            [575, 470, 575, 518],
            [915, 470, 915, 518],
          ].map(([x1, y1, x2, y2], index) => {
            const length = Math.hypot(x2 - x1, y2 - y1);
            const progress = Math.min(1, Math.max(0, (frame - 20 - index * 4) / 20));
            return (
              <line
                key={`line-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={theme.colors.teal}
                strokeWidth={6}
                strokeDasharray={length}
                strokeDashoffset={length * (1 - progress)}
              />
            );
          })}
        </svg>

        <FlowNode label="Ore" left={nodePositions.ore.left} top={nodePositions.ore.top} index={0} />
        <FlowNode
          label="Concentration"
          left={nodePositions.concentration.left}
          top={nodePositions.concentration.top}
          index={1}
        />
        <FlowNode
          label="High reactivity"
          left={nodePositions.high.left}
          top={nodePositions.high.top}
          index={2}
        />
        <FlowNode
          label="Medium reactivity"
          left={nodePositions.medium.left}
          top={nodePositions.medium.top}
          index={3}
        />
        <FlowNode
          label="Low reactivity"
          left={nodePositions.low.left}
          top={nodePositions.low.top}
          index={4}
        />
        <FlowNode
          label="Electrolysis"
          left={nodePositions.electrolysis.left}
          top={nodePositions.electrolysis.top}
          index={5}
        />
        <FlowNode
          label="Roasting then reduction"
          left={nodePositions.roasting.left}
          top={nodePositions.roasting.top}
          index={6}
        />
        <FlowNode
          label="Heating alone"
          left={nodePositions.heating.left}
          top={nodePositions.heating.top}
          index={7}
        />

        <ChemicalEquation
          equation="Fe2O3 + 2Al -> 2Fe + Al2O3 + heat"
          label="Thermite reaction joins broken railway tracks"
          accent={theme.colors.coral}
          style={{ position: "absolute", left: 120, bottom: 24, width: 880 }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 640,
          height: 640,
          borderRadius: 38,
          background: panelGradient,
          border: "1px solid rgba(255,255,255,0.12)",
          padding: "28px 30px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            color: theme.colors.white,
            fontFamily: theme.fonts.heading,
            fontSize: 38,
          }}
        >
          Corrosion and alloys
        </div>
        <div
          style={{
            marginTop: 10,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: 23,
          }}
        >
          The video can turn dry lists into visible before-and-after change.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginTop: 24,
          }}
        >
          {[
            { label: "Silver", after: "Black tarnish", color: theme.colors.slate },
            { label: "Copper", after: "Green coat", color: theme.colors.green },
            { label: "Iron", after: "Brown rust", color: "#b36b3d" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 24,
                padding: "18px 16px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  color: theme.colors.white,
                  fontFamily: theme.fonts.heading,
                  fontSize: 24,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  marginTop: 16,
                  width: "100%",
                  height: 62,
                  borderRadius: 20,
                  background: "linear-gradient(180deg, #d4dce7 0%, #8aa0bc 100%)",
                }}
              />
              <div
                style={{
                  marginTop: 12,
                  width: "100%",
                  height: 62,
                  borderRadius: 20,
                  background: item.color,
                }}
              />
              <div
                style={{
                  marginTop: 12,
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                  fontSize: 18,
                }}
              >
                {item.after}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {["Paint", "Oil or grease", "Galvanisation", "Alloying"].map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 999,
                padding: "12px 16px",
                background: "rgba(68,214,180,0.12)",
                border: `1px solid ${theme.colors.teal}`,
                color: theme.colors.white,
                fontFamily: theme.fonts.body,
                fontSize: 20,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            borderRadius: 26,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr",
              padding: "14px 18px",
              background: "rgba(255,255,255,0.05)",
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
              fontSize: 18,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            <div>Alloy</div>
            <div>Parts</div>
            <div>Use</div>
          </div>
          {alloyRows.map((row) => (
            <div
              key={row.alloy}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1.2fr",
                padding: "14px 18px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontSize: 20,
              }}
            >
              <div>{row.alloy}</div>
              <div>{row.parts}</div>
              <div>{row.use}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 24,
            padding: "18px 20px",
            background: "rgba(255,191,82,0.12)",
            border: `1px solid ${theme.colors.amber}`,
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
            fontSize: 21,
            lineHeight: 1.42,
          }}
        >
          The Iron Pillar in Delhi has stood for around 1600 years with
          remarkable rust resistance, which is a great Indian context moment
          for the lesson.
        </div>
      </div>
    </ChapterFrame>
  );
};
