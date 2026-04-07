import { Sequence, interpolate, useCurrentFrame } from "remotion";
import { ChapterFrame } from "../components/ChapterFrame";
import { PropertyCard } from "../components/PropertyCard";
import { physicalProperties } from "../data/chapterContent";
import { panelGradient, theme } from "../styles/theme";

const sectionLabels = [
  "Lustre",
  "Malleability",
  "Ductility",
  "Conductivity",
  "Sonority",
];

const propertyBeat = 180;
const malleabilityStart = propertyBeat;
const ductilityStart = propertyBeat * 2;
const conductivityStart = propertyBeat * 3;
const sonorityStart = propertyBeat * 4;

export const Scene02PhysicalProperties = () => {
  const frame = useCurrentFrame();

  return (
    <ChapterFrame
      eyebrow="Physical Properties"
      title="Metals are useful because their physical properties stand out"
      subtitle="The chapter starts with the things students can observe with their own eyes and hands."
      accent={theme.colors.amber}
      progress={0.25}
      footer="The demo uses one animated idea per property so the visual can stick in memory."
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 980,
          height: 620,
          borderRadius: 40,
          background: panelGradient,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: theme.shadows.soft,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 34,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {sectionLabels.map((label, index) => {
            const active =
              frame >= index * propertyBeat && frame < (index + 1) * propertyBeat
                ? true
                : frame >= sonorityStart && index === 4;

            return (
              <div
                key={label}
                style={{
                  borderRadius: 999,
                  padding: "10px 16px",
                  background: active ? "rgba(255,191,82,0.18)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active ? theme.colors.amber : "rgba(255,255,255,0.08)"}`,
                  color: active ? theme.colors.white : theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                  fontSize: 18,
                }}
              >
                {label}
              </div>
            );
          })}
        </div>

        <Sequence durationInFrames={propertyBeat}>
          <div style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                left: 200,
                top: 150,
                width: 320,
                height: 320,
                borderRadius: 999,
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(221,228,236,0.9) 24%, rgba(125,150,179,0.9) 72%, rgba(83,104,133,1) 100%)",
                boxShadow: "0 35px 70px rgba(0,0,0,0.32)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 160 + (frame % propertyBeat) * 2.6,
                top: 124,
                width: 100,
                height: 370,
                transform: "rotate(14deg)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0) 100%)",
                filter: "blur(6px)",
                opacity: 0.8,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 80,
                top: 164,
                width: 300,
              }}
            >
              <div
                style={{
                  color: theme.colors.yellow,
                  fontFamily: theme.fonts.heading,
                  fontSize: 46,
                }}
              >
                Lustre
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 28,
                  lineHeight: 1.45,
                }}
              >
                Clean a metal surface and it starts to shine. That shiny look
                is called metallic lustre.
              </div>
            </div>
          </div>
        </Sequence>

        <Sequence from={malleabilityStart} durationInFrames={propertyBeat}>
          <div style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                left: 250,
                top: 340,
                width: 300 +
                  interpolate(frame, [malleabilityStart, malleabilityStart + 84], [0, 110], {
                    extrapolateRight: "clamp",
                  }),
                height: 90 -
                  interpolate(frame, [malleabilityStart, malleabilityStart + 84], [0, 26], {
                    extrapolateRight: "clamp",
                  }),
                background: "linear-gradient(135deg, #f6d36f 0%, #c88a17 100%)",
                borderRadius: 20,
                boxShadow: "0 26px 45px rgba(200,138,23,0.28)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 390,
                top: 150 +
                  interpolate(frame, [malleabilityStart, malleabilityStart + 60], [0, 200], {
                    extrapolateRight: "clamp",
                  }),
                width: 190,
                height: 88,
                borderRadius: 18,
                background: "linear-gradient(180deg, #9aa8bf 0%, #6f8099 100%)",
                transform: `rotate(${interpolate(
                  frame,
                  [malleabilityStart + 52, malleabilityStart + 86],
                  [0, 14],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )}deg)`,
                transformOrigin: "right center",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 86,
                top: 170,
                width: 300,
              }}
            >
              <div
                style={{
                  color: theme.colors.amber,
                  fontFamily: theme.fonts.heading,
                  fontSize: 46,
                }}
              >
                Malleability
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 28,
                  lineHeight: 1.45,
                }}
              >
                Metals can be beaten into sheets. Gold and silver are the most
                malleable.
              </div>
            </div>
          </div>
        </Sequence>

        <Sequence from={ductilityStart} durationInFrames={propertyBeat}>
          <div style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                left: 180,
                top: 280,
                width: 240,
                height: 92,
                borderRadius: 46,
                background: "linear-gradient(90deg, #b8c9da 0%, #7d96b3 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 410,
                top: 316,
                width: 120 +
                  interpolate(frame, [ductilityStart, ductilityStart + 140], [0, 420], {
                    extrapolateRight: "clamp",
                  }),
                height: 22,
                borderRadius: 999,
                background: "linear-gradient(90deg, #76c6ff 0%, #d0e8ff 100%)",
                boxShadow: theme.shadows.glowBlue,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 90,
                top: 166,
                width: 300,
              }}
            >
              <div
                style={{
                  color: theme.colors.blue,
                  fontFamily: theme.fonts.heading,
                  fontSize: 46,
                }}
              >
                Ductility
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 28,
                  lineHeight: 1.45,
                }}
              >
                Metals can be drawn into thin wires. One gram of gold can be
                stretched to about 2 km.
              </div>
            </div>
          </div>
        </Sequence>

        <Sequence from={conductivityStart} durationInFrames={propertyBeat}>
          <div style={{ position: "absolute", inset: 0 }}>
            <svg
              width={980}
              height={620}
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
            >
              <path
                d="M 180 350 H 310 V 280 H 470 V 350 H 640"
                stroke="#d8e5f7"
                strokeWidth={14}
                fill="none"
                strokeLinecap="round"
              />
              <rect x={140} y={280} width={92} height={140} rx={20} fill="#42546e" />
              <rect x={156} y={305} width={26} height={90} rx={10} fill="#f87070" />
              <rect x={190} y={305} width={26} height={90} rx={10} fill="#76c6ff" />
              <circle
                cx={520}
                cy={270}
                r={52}
                fill="#ffe081"
                style={{ filter: "drop-shadow(0 0 28px rgba(255,224,129,0.75))" }}
              />
              <rect x={500} y={304} width={40} height={86} rx={14} fill="#8a5d32" />
              {Array.from({ length: 7 }).map((_, index) => (
                <circle
                  key={`electron-${index}`}
                  cx={210 + ((frame - conductivityStart) * 4.5 + index * 52) % 420}
                  cy={350}
                  r={8}
                  fill={theme.colors.blue}
                />
              ))}
            </svg>
            <div
              style={{
                position: "absolute",
                right: 82,
                top: 150,
                width: 314,
              }}
            >
              <div
                style={{
                  color: theme.colors.teal,
                  fontFamily: theme.fonts.heading,
                  fontSize: 46,
                }}
              >
                Conductivity
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 28,
                  lineHeight: 1.45,
                }}
              >
                Heat and electricity move through metals easily, which is why
                they are used for utensils and wires.
              </div>
            </div>
          </div>
        </Sequence>

        <Sequence from={sonorityStart} durationInFrames={propertyBeat}>
          <div style={{ position: "absolute", inset: 0 }}>
            <div
              style={{
                position: "absolute",
                left: 260,
                top: 176,
                width: 240,
                height: 280,
                borderRadius: "120px 120px 80px 80px",
                background: "linear-gradient(180deg, #f4d06f 0%, #af7721 100%)",
                transform: `rotate(${Math.sin((frame - sonorityStart) / 12) * 10}deg)`,
                transformOrigin: "50% 18%",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 324,
                top: 120,
                width: 110,
                height: 90,
                borderRadius: 60,
                background: "linear-gradient(180deg, #c8d7ea 0%, #8499b5 100%)",
              }}
            />
            {Array.from({ length: 4 }).map((_, index) => {
              const ring = (frame - sonorityStart + index * 20) % 120;
              return (
                <div
                  key={`ring-${index}`}
                  style={{
                    position: "absolute",
                    left: 450 - ring * 2.4,
                    top: 250 - ring * 1.1,
                    width: 50 + ring * 2.6,
                    height: 50 + ring * 2.6,
                    borderRadius: 999,
                    border: "3px solid rgba(255,255,255,0.4)",
                    opacity: 1 - ring / 120,
                  }}
                />
              );
            })}
            <div
              style={{
                position: "absolute",
                right: 80,
                top: 164,
                width: 300,
              }}
            >
              <div
                style={{
                  color: theme.colors.rose,
                  fontFamily: theme.fonts.heading,
                  fontSize: 46,
                }}
              >
                Sonority
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 28,
                  lineHeight: 1.45,
                }}
              >
                Strike a metal bell and it rings. That sound-making quality is
                called sonority.
              </div>
            </div>
          </div>
        </Sequence>
      </div>

      <div
        style={{
          position: "absolute",
          left: 1030,
          right: 0,
          top: 12,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
        }}
      >
        {physicalProperties.map((property, index) => (
          <PropertyCard
            key={property.title}
            icon={property.icon}
            title={property.title}
            description={property.description}
            detail={property.detail}
            accent={property.accent}
            index={index}
            startFrame={24}
            width={350}
          />
        ))}
      </div>
    </ChapterFrame>
  );
};
