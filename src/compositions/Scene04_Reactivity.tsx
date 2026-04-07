import { Sequence, interpolate, useCurrentFrame } from "remotion";
import { ChapterFrame } from "../components/ChapterFrame";
import { BubbleEffect } from "../components/BubbleEffect";
import { ChemicalEquation } from "../components/ChemicalEquation";
import { FlameEffect } from "../components/FlameEffect";
import { ReactivityLadder } from "../components/ReactivityLadder";
import { panelGradient, theme } from "../styles/theme";

const glassStyle = {
  position: "absolute" as const,
  width: 180,
  height: 250,
  borderRadius: "30px 30px 28px 28px",
  border: "4px solid rgba(226,239,255,0.5)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
};

const oxygenDuration = 270;
const waterDuration = 270;
const acidDuration = 270;
const seriesDuration = 270;

const oxygenStart = 0;
const waterStart = oxygenStart + oxygenDuration;
const acidStart = waterStart + waterDuration;
const seriesStart = acidStart + acidDuration;

export const Scene04Reactivity = () => {
  const frame = useCurrentFrame();

  return (
    <ChapterFrame
      eyebrow="Chemical Properties"
      title="Reactions tell us which metals are calm and which are wildly reactive"
      subtitle="The chapter moves from oxygen to water to acids, and then locks the pattern in using the reactivity series."
      accent={theme.colors.coral}
      progress={0.62}
      footer="A strong educational video should make the danger level and reaction pattern visually obvious."
    >
      <Sequence durationInFrames={oxygenDuration}>
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 10,
              width: 1080,
              height: 600,
              borderRadius: 38,
              background: panelGradient,
              border: "1px solid rgba(255,255,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 80,
                top: 220,
                width: 280,
                height: 26,
                borderRadius: 999,
                background: "linear-gradient(90deg, #d0e0f0 0%, #8fa8c2 100%)",
              }}
            />
            <FlameEffect x={125} y={180} outerColor="#fff2d7" innerColor="#ffffff" label="Mg" />
            <div
              style={{
                position: "absolute",
                left: 450,
                top: 200,
                width: 190,
                height: 190,
                borderRadius: 999,
                background:
                  interpolate(frame, [oxygenStart, oxygenStart + 140], [0, 1]) > 0.6
                    ? "#1f1917"
                    : "#b96b2f",
                boxShadow: "0 20px 50px rgba(0,0,0,0.24)",
              }}
            />
            <FlameEffect x={470} y={350} outerColor="#ffbf52" innerColor="#fff0cc" label="Cu" />
            <div
              style={{
                position: "absolute",
                right: 120,
                top: 170,
                width: 200,
                height: 200,
                borderRadius: 50,
                background: "linear-gradient(135deg, #f6d36f 0%, #c48723 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.colors.background,
                fontFamily: theme.fonts.heading,
                fontSize: 66,
              }}
            >
              Au
            </div>
            <div
              style={{
                position: "absolute",
                right: 150,
                top: 160,
                color: theme.colors.red,
                fontSize: 140,
                fontFamily: theme.fonts.heading,
              }}
            >
              ×
            </div>
            <ChemicalEquation
              equation="2Mg + O2 -> 2MgO"
              label="Dazzling white flame"
              accent={theme.colors.white}
              style={{ position: "absolute", left: 80, bottom: 34, width: 360 }}
            />
            <ChemicalEquation
              equation="2Cu + O2 -> 2CuO"
              label="Hot copper turns black"
              accent={theme.colors.coral}
              style={{ position: "absolute", left: 420, bottom: 34, width: 360 }}
            />
            <div
              style={{
                position: "absolute",
                right: 50,
                bottom: 42,
                width: 300,
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontSize: 24,
                lineHeight: 1.42,
              }}
            >
              Silver and gold do not react with oxygen even at high
              temperatures.
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 30,
              width: 620,
              borderRadius: 32,
              padding: "28px 30px",
              background: "rgba(255,125,103,0.12)",
              border: `1px solid ${theme.colors.coral}`,
            }}
          >
            <div
              style={{
                color: theme.colors.white,
                fontFamily: theme.fonts.heading,
                fontSize: 38,
              }}
            >
              Oxygen reactions
            </div>
            <div
              style={{
                marginTop: 16,
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontSize: 26,
                lineHeight: 1.46,
              }}
            >
              Magnesium burns brilliantly, copper gets a black oxide coating,
              and highly unreactive metals like silver and gold stay shiny.
            </div>
          </div>
        </div>
      </Sequence>

      <Sequence from={waterStart} durationInFrames={waterDuration}>
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 18,
              width: 1120,
              height: 610,
              borderRadius: 38,
              background: panelGradient,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ ...glassStyle, left: 56, top: 210 }}>
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  bottom: 0,
                  height: 130,
                  borderRadius: "0 0 24px 24px",
                  background:
                    "linear-gradient(180deg, rgba(66,214,255,0.2) 0%, rgba(31,125,214,0.5) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 60,
                  top: 88 +
                    interpolate(frame, [waterStart, waterStart + 90], [0, 74], {
                      extrapolateRight: "clamp",
                    }),
                  width: 60,
                  height: 44,
                  borderRadius: 18,
                  background: theme.colors.coral,
                }}
              />
              <BubbleEffect x={20} y={220} width={140} height={180} />
              <FlameEffect
                x={20}
                y={120}
                scale={0.78}
                outerColor="#ff7d67"
                innerColor="#ffd0b8"
              />
            </div>
            <div style={{ ...glassStyle, left: 332, top: 210 }}>
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  bottom: 0,
                  height: 130,
                  borderRadius: "0 0 24px 24px",
                  background:
                    "linear-gradient(180deg, rgba(66,214,255,0.2) 0%, rgba(31,125,214,0.5) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 58,
                  top: 134 -
                    interpolate(frame, [waterStart + 30, waterStart + 140], [0, 28], {
                      extrapolateRight: "clamp",
                    }),
                  width: 64,
                  height: 42,
                  borderRadius: 18,
                  background: "#d4dce7",
                }}
              />
              <BubbleEffect x={296} y={228} width={160} height={170} />
            </div>
            <div style={{ ...glassStyle, left: 608, top: 210 }}>
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  bottom: 0,
                  height: 88,
                  borderRadius: "0 0 24px 24px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%)",
                }}
              />
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`steam-${index}`}
                  style={{
                    position: "absolute",
                    left: 26 + index * 26,
                    top: 70 + Math.sin((frame - waterStart + index * 7) / 12) * 8,
                    width: 54,
                    height: 54,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.18)",
                    filter: "blur(4px)",
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 68,
                  top: 150,
                  width: 44,
                  height: 120,
                  background: "linear-gradient(180deg, #b3c1d6 0%, #7d96b3 100%)",
                  borderRadius: 20,
                }}
              />
            </div>
            {[
              { title: "Na / K + cold water", left: 48 },
              { title: "Calcium + water", left: 332 },
              { title: "Al / Fe + steam", left: 610 },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  position: "absolute",
                  left: item.left,
                  top: 126,
                  width: 210,
                  textAlign: "center",
                  color: theme.colors.white,
                  fontFamily: theme.fonts.heading,
                  fontSize: 28,
                }}
              >
                {item.title}
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 34,
              width: 580,
            }}
          >
            <div
              style={{
                borderRadius: 30,
                padding: "26px 28px",
                background: "rgba(118,198,255,0.12)",
                border: `1px solid ${theme.colors.blue}`,
              }}
            >
              <div
                style={{
                  color: theme.colors.white,
                  fontFamily: theme.fonts.heading,
                  fontSize: 38,
                }}
              >
                Water reactions
              </div>
              <div
                style={{
                  marginTop: 14,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 25,
                  lineHeight: 1.48,
                }}
              >
                Potassium and sodium react violently. Calcium is calmer and
                floats because hydrogen bubbles stick to it. Aluminium and iron
                need steam.
              </div>
            </div>
            <ChemicalEquation
              equation="2Na + 2H2O -> 2NaOH + H2 + heat"
              label="Cold water can be dangerous"
              accent={theme.colors.blue}
              style={{ marginTop: 20 }}
            />
            <ChemicalEquation
              equation="3Fe + 4H2O -> Fe3O4 + 4H2"
              label="Steam reaction"
              accent={theme.colors.teal}
              style={{ marginTop: 16 }}
            />
          </div>
        </div>
      </Sequence>

      <Sequence from={acidStart} durationInFrames={acidDuration}>
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 26,
              width: 980,
              height: 600,
              borderRadius: 38,
              background: panelGradient,
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "42px 34px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                color: theme.colors.white,
                fontFamily: theme.fonts.heading,
                fontSize: 42,
              }}
            >
              Dilute acids
            </div>
            <div
              style={{
                marginTop: 10,
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
                fontSize: 24,
              }}
            >
              More bubbles means faster hydrogen gas production.
            </div>
            {[
              { label: "Mg", value: 100, color: theme.colors.red },
              { label: "Al", value: 84, color: theme.colors.amber },
              { label: "Zn", value: 72, color: theme.colors.yellow },
              { label: "Fe", value: 52, color: theme.colors.teal },
              { label: "Cu", value: 8, color: theme.colors.slate },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  marginTop: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 70,
                    color: theme.colors.white,
                    fontFamily: theme.fonts.heading,
                    fontSize: 28,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    width: 720,
                    height: 32,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${item.value}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <ChemicalEquation
              equation="Mg + 2HCl -> MgCl2 + H2"
              label="General rule: metal + dilute acid -> salt + hydrogen"
              accent={theme.colors.coral}
              style={{ position: "absolute", left: 34, right: 34, bottom: 32 }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 40,
              width: 640,
            }}
          >
            <div
              style={{
                borderRadius: 34,
                padding: "28px 30px",
                background: "rgba(255,191,82,0.14)",
                border: `1px solid ${theme.colors.amber}`,
                boxShadow: theme.shadows.glowAmber,
              }}
            >
              <div
                style={{
                  color: theme.colors.white,
                  fontFamily: theme.fonts.heading,
                  fontSize: 42,
                }}
              >
                Aqua regia
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 28,
                  lineHeight: 1.44,
                }}
              >
                3 parts HCl + 1 part HNO3. This fresh mixture can dissolve
                gold, even though neither acid does that alone.
              </div>
            </div>
            <div
              style={{
                marginTop: 22,
                borderRadius: 30,
                padding: "24px 28px",
                background: "rgba(8,20,38,0.66)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontSize: 24,
                lineHeight: 1.44,
              }}
            >
              Copper shows almost no bubbles with dilute HCl, which makes the
              reaction order easy to visualize.
            </div>
          </div>
        </div>
      </Sequence>

      <Sequence from={seriesStart} durationInFrames={seriesDuration}>
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", left: 0, top: 20 }}>
            <ReactivityLadder />
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 28,
              width: 740,
              height: 600,
              borderRadius: 38,
              background: panelGradient,
              border: "1px solid rgba(255,255,255,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "28px 30px 0",
                color: theme.colors.white,
                fontFamily: theme.fonts.heading,
                fontSize: 40,
              }}
            >
              Displacement demo
            </div>
            <div
              style={{
                padding: "12px 30px 0",
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
                fontSize: 24,
              }}
            >
              Iron is above copper, so it pushes copper out of copper sulphate.
            </div>
            <div
              style={{
                position: "absolute",
                left: 110,
                top: 170,
                width: 520,
                height: 290,
                borderRadius: "34px 34px 28px 28px",
                border: "4px solid rgba(226,239,255,0.55)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: 0,
                  height: 180,
                  borderRadius: "0 0 24px 24px",
                  background:
                    "linear-gradient(180deg, rgba(118,198,255,0.36) 0%, rgba(59,110,193,0.9) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 230,
                  top: 8,
                  width: 58,
                  height: 260,
                  borderRadius: 20,
                  background:
                    "linear-gradient(180deg, #a9b8ce 0%, #c6704d 55%, #c6704d 78%, #8897ac 100%)",
                  transform: `rotate(${Math.sin((frame - seriesStart) / 12) * 2.5}deg)`,
                }}
              />
            </div>
            <ChemicalEquation
              equation="Fe + CuSO4 -> FeSO4 + Cu"
              label="Blue solution fades as copper forms"
              accent={theme.colors.indigo}
              style={{ position: "absolute", left: 52, right: 52, bottom: 34 }}
            />
          </div>
        </div>
      </Sequence>
    </ChapterFrame>
  );
};
