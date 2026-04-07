import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ChapterFrame } from "../components/ChapterFrame";
import { ChemicalEquation } from "../components/ChemicalEquation";
import { ElectronTransfer } from "../components/ElectronTransfer";
import { PropertyCard } from "../components/PropertyCard";
import { ionicProperties } from "../data/chapterContent";
import { panelGradient, theme } from "../styles/theme";

export const Scene05IonicBond = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const conductivity = spring({
    frame: frame - 190,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  return (
    <ChapterFrame
      eyebrow="Ionic Bonds"
      title="Metals usually lose electrons. Non-metals usually gain them."
      subtitle="This is the heart of the chapter: electron transfer explains why compounds like NaCl behave the way they do."
      accent={theme.colors.indigo}
      progress={0.8}
      footer="This is where Remotion becomes especially useful because static textbook diagrams become an actual motion event."
      contentStyle={{ overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 720,
          borderRadius: 38,
          background: panelGradient,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: theme.shadows.soft,
          overflow: "hidden",
        }}
      >
        <ElectronTransfer />

        <ChemicalEquation
          equation="Mg -> Mg2+ + 2e-"
          label="The same idea scales up"
          accent={theme.colors.coral}
          style={{
            position: "absolute",
            left: 70,
            bottom: 96,
            width: 420,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 78,
            bottom: 102,
            width: 450,
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
            fontSize: 25,
            lineHeight: 1.42,
          }}
        >
          Magnesium loses two electrons, so two chlorine atoms are needed to
          build MgCl2.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 8,
          display: "flex",
          gap: 18,
          justifyContent: "space-between",
        }}
      >
        {ionicProperties.map((property, index) => (
          <PropertyCard
            key={property.title}
            icon={property.icon}
            title={property.title}
            description={property.description}
            accent={property.accent}
            index={index}
            startFrame={150}
            width={430}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          right: 40,
          top: 190,
          width: 460,
          borderRadius: 30,
          padding: "20px 22px",
          background: "rgba(8,20,38,0.72)",
          border: "1px solid rgba(255,255,255,0.1)",
          opacity: conductivity,
          transform: `translateY(${(1 - conductivity) * 18}px)`,
        }}
      >
        <div
          style={{
            color: theme.colors.white,
            fontFamily: theme.fonts.heading,
            fontSize: 28,
          }}
        >
          Conductivity reminder
        </div>
        <div
          style={{
            marginTop: 10,
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
            fontSize: 22,
            lineHeight: 1.42,
          }}
        >
          Solid salt keeps ions locked in place, so the bulb stays off. Melt it
          or dissolve it, and the ions can move.
        </div>
      </div>
    </ChapterFrame>
  );
};
