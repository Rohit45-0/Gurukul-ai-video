export const physicalProperties = [
  {
    icon: "L",
    title: "Lustrous",
    description: "Shiny surface after cleaning",
    detail: "Pure metals have metallic lustre.",
    accent: "#ffe081",
  },
  {
    icon: "M",
    title: "Malleable",
    description: "Can be beaten into sheets",
    detail: "Gold and silver are extremely malleable.",
    accent: "#ffbf52",
  },
  {
    icon: "D",
    title: "Ductile",
    description: "Can be drawn into wires",
    detail: "1 gram of gold can become about 2 km of wire.",
    accent: "#76c6ff",
  },
  {
    icon: "C",
    title: "Conductive",
    description: "Heat and electricity pass through easily",
    detail: "Silver and copper are excellent conductors.",
    accent: "#44d6b4",
  },
  {
    icon: "S",
    title: "Sonorous",
    description: "Makes sound when struck",
    detail: "That is why bells are made from metals.",
    accent: "#ff67a8",
  },
];

export const comparisonRows = [
  { property: "Lustre", metals: "Shiny surface", nonMetals: "Usually dull" },
  {
    property: "Malleability",
    metals: "Can be beaten into sheets",
    nonMetals: "Brittle",
  },
  {
    property: "Ductility",
    metals: "Can be drawn into wires",
    nonMetals: "Generally no",
  },
  {
    property: "Conductivity",
    metals: "Good conductors",
    nonMetals: "Usually poor conductors",
  },
  {
    property: "State",
    metals: "Mostly solids",
    nonMetals: "Solids or gases",
  },
];

export const exceptionFacts = [
  "Iodine is a non-metal but it is lustrous.",
  "Graphite conducts electricity even though it is a non-metal.",
  "Gallium melts on your palm because of its low melting point.",
  "Sodium and potassium are so soft they can be cut with a knife.",
];

export const reactivitySeries = [
  { symbol: "K", name: "Potassium", score: 100 },
  { symbol: "Na", name: "Sodium", score: 93 },
  { symbol: "Ca", name: "Calcium", score: 84 },
  { symbol: "Mg", name: "Magnesium", score: 75 },
  { symbol: "Al", name: "Aluminium", score: 66 },
  { symbol: "Zn", name: "Zinc", score: 57 },
  { symbol: "Fe", name: "Iron", score: 48 },
  { symbol: "Pb", name: "Lead", score: 38 },
  { symbol: "H", name: "Hydrogen", score: 30, isReference: true },
  { symbol: "Cu", name: "Copper", score: 22 },
  { symbol: "Ag", name: "Silver", score: 12 },
  { symbol: "Au", name: "Gold", score: 5 },
];

export const ionicProperties = [
  {
    icon: "H",
    title: "Hard and brittle",
    description: "Strong attraction between positive and negative ions.",
    accent: "#6f86ff",
  },
  {
    icon: "T",
    title: "High melting point",
    description: "It takes lots of energy to break ionic attraction.",
    accent: "#ffbf52",
  },
  {
    icon: "W",
    title: "Soluble in water",
    description: "Usually dissolve in water but not in petrol or kerosene.",
    accent: "#44d6b4",
  },
  {
    icon: "E",
    title: "Conduct when molten or dissolved",
    description: "Ions need freedom to move before electricity can flow.",
    accent: "#76c6ff",
  },
];

export const alloyRows = [
  { alloy: "Brass", parts: "Cu + Zn", use: "Decorative items" },
  { alloy: "Bronze", parts: "Cu + Sn", use: "Statues and bells" },
  {
    alloy: "Stainless steel",
    parts: "Fe + Ni + Cr",
    use: "Utensils and structures",
  },
  { alloy: "Solder", parts: "Pb + Sn", use: "Joining electrical wires" },
];
