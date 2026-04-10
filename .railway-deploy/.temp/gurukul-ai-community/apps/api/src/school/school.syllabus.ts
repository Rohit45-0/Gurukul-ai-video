export interface SyllabusOption {
  id: string;
  label: string;
}

export interface SyllabusQuestion {
  id: string;
  type: 'mcq' | 'scenario';
  prompt: string;
  explanation: string;
  correctChoiceId: string;
  options: SyllabusOption[];
}

export interface SyllabusTopic {
  id: string;
  title: string;
  timestampLabel: string;
  startSeconds: number;
  endSeconds: number;
  mission: string;
  sourceAnchor: string;
  quiz: SyllabusQuestion;
  scenario: SyllabusQuestion;
}

export interface ChapterSyllabus {
  chapterKey: string;
  chapterTitle: string;
  subject: string;
  summary: string;
  sourcePdfUrl: string;
  videoUrl: string;
  topics: SyllabusTopic[];
}

export const chapterSyllabusCatalog: Record<string, ChapterSyllabus> = {
  'metals-and-non-metals': {
    chapterKey: 'metals-and-non-metals',
    chapterTitle: 'Metals and Non-metals',
    subject: 'Science',
    summary:
      'Chapter 3 explores the physical and chemical properties of metals and non-metals, their reactions, the reactivity series, and the real-life reason these properties matter.',
    sourcePdfUrl: 'https://ncert.nic.in/textbook/pdf/jesc103.pdf',
    videoUrl:
      'https://s3.us-east-1.amazonaws.com/gurukul-platform-45/gurukul/videos/metals-and-non-metals-demo-voiced-1080.mp4',
    topics: [
      {
        id: 'topic-01',
        title: 'Everyday Materials Around Us',
        timestampLabel: '0:00',
        startSeconds: 0,
        endSeconds: 32,
        mission:
          'Recognise which everyday objects are metals and which are non-metals.',
        sourceAnchor: 'NCERT Ch. 3 - Introduction, Page 37',
        quiz: {
          id: 'q1',
          type: 'mcq',
          prompt:
            'Which of the following is a non-metal that conducts electricity?',
          correctChoiceId: 'q1-b',
          explanation:
            'Graphite is the common exception among non-metals because its structure allows electrons to move.',
          options: [
            { id: 'q1-a', label: 'Sulphur' },
            { id: 'q1-b', label: 'Graphite (a form of carbon)' },
            { id: 'q1-c', label: 'Phosphorus' },
          ],
        },
        scenario: {
          id: 's1',
          type: 'scenario',
          prompt:
            'A cooking pan has a steel body but a wooden handle. Why is wood used for the handle instead of steel?',
          correctChoiceId: 's1-b',
          explanation:
            'The pan body should conduct heat, but the handle should stay cooler and safer to hold.',
          options: [
            { id: 's1-a', label: 'Wood is cheaper than steel' },
            {
              id: 's1-b',
              label: 'Wood is a poor conductor of heat, so the handle stays cool',
            },
            { id: 's1-c', label: 'Wood is lighter than steel' },
          ],
        },
      },
      {
        id: 'topic-02',
        title: 'Physical Properties of Metals',
        timestampLabel: '0:32',
        startSeconds: 32,
        endSeconds: 67,
        mission:
          'Understand how lustre, malleability, ductility, and conductivity explain real objects.',
        sourceAnchor: 'NCERT Ch. 3 - Section 3.1, Page 38',
        quiz: {
          id: 'q2',
          type: 'mcq',
          prompt:
            'If a metal can be drawn into thin wires, which property is being described?',
          correctChoiceId: 'q2-b',
          explanation:
            'Ductility is the property that allows metals such as copper and aluminium to be drawn into wires.',
          options: [
            { id: 'q2-a', label: 'Malleability' },
            { id: 'q2-b', label: 'Ductility' },
            { id: 'q2-c', label: 'Lustre' },
          ],
        },
        scenario: {
          id: 's2',
          type: 'scenario',
          prompt:
            'Why is copper used inside most electrical wires while the outer layer is plastic?',
          correctChoiceId: 's2-b',
          explanation:
            'Copper carries current well and can be drawn into wires; plastic is used outside because it insulates.',
          options: [
            { id: 's2-a', label: 'Copper is magnetic and attracts electricity' },
            {
              id: 's2-b',
              label: 'Copper is ductile and conducts electricity well',
            },
            { id: 's2-c', label: 'Copper does not heat up' },
          ],
        },
      },
      {
        id: 'topic-03',
        title: 'Chemical Properties - Reactions with Air',
        timestampLabel: '1:07',
        startSeconds: 67,
        endSeconds: 101,
        mission:
          'Understand why some metals tarnish, some rust, and some stay shiny for years.',
        sourceAnchor: 'NCERT Ch. 3 - Section 3.2.1, Page 41',
        quiz: {
          id: 'q3',
          type: 'mcq',
          prompt:
            'When magnesium burns in oxygen, what type of compound is formed?',
          correctChoiceId: 'q3-b',
          explanation:
            'Magnesium oxide is a basic oxide because magnesium is a metal.',
          options: [
            { id: 'q3-a', label: 'An acidic oxide' },
            { id: 'q3-b', label: 'A basic oxide' },
            { id: 'q3-c', label: 'A neutral compound' },
          ],
        },
        scenario: {
          id: 's3',
          type: 'scenario',
          prompt:
            'Why do iron school gates need paint or coating while gold jewellery usually does not?',
          correctChoiceId: 's3-b',
          explanation:
            'Iron reacts with air and moisture to form rust, while gold is much less reactive.',
          options: [
            { id: 's3-a', label: 'Because gold is softer than iron' },
            {
              id: 's3-b',
              label:
                'Because iron reacts with air and moisture more easily, forming rust',
            },
            { id: 's3-c', label: 'Because iron absorbs colour from the environment' },
          ],
        },
      },
      {
        id: 'topic-04',
        title: 'Reactions with Water and Acids',
        timestampLabel: '1:41',
        startSeconds: 101,
        endSeconds: 135,
        mission:
          'Predict which metals react strongly, weakly, or not at all with water and acids.',
        sourceAnchor: 'NCERT Ch. 3 - Sections 3.2.2 and 3.2.3, Pages 42-43',
        quiz: {
          id: 'q4',
          type: 'mcq',
          prompt:
            'When zinc reacts with dilute sulphuric acid, which products are formed?',
          correctChoiceId: 'q4-b',
          explanation:
            'A metal plus acid reaction here gives zinc sulphate and hydrogen gas.',
          options: [
            { id: 'q4-a', label: 'Zinc oxide and water' },
            { id: 'q4-b', label: 'Zinc sulphate and hydrogen gas' },
            { id: 'q4-c', label: 'Zinc chloride and oxygen gas' },
          ],
        },
        scenario: {
          id: 's4',
          type: 'scenario',
          prompt:
            'A student drops magnesium ribbon into dilute hydrochloric acid and sees bubbles. What are the bubbles?',
          correctChoiceId: 's4-b',
          explanation:
            'Magnesium displaces hydrogen from the acid, so the bubbles are hydrogen gas.',
          options: [
            { id: 's4-a', label: 'Carbon dioxide' },
            { id: 's4-b', label: 'Hydrogen gas' },
            { id: 's4-c', label: 'Oxygen gas' },
          ],
        },
      },
      {
        id: 'topic-05',
        title: 'The Reactivity Series',
        timestampLabel: '2:15',
        startSeconds: 135,
        endSeconds: 170,
        mission:
          'Use the reactivity series to predict which metals can displace others.',
        sourceAnchor: 'NCERT Ch. 3 - Section 3.3, Page 45',
        quiz: {
          id: 'q5',
          type: 'mcq',
          prompt:
            'What happens when iron is placed in copper sulphate solution?',
          correctChoiceId: 'q5-b',
          explanation:
            'Iron is more reactive than copper, so it displaces copper from the solution.',
          options: [
            { id: 'q5-a', label: 'Nothing happens' },
            {
              id: 'q5-b',
              label:
                'Iron displaces copper, and the nail gets a reddish-brown coating',
            },
            { id: 'q5-c', label: 'Copper displaces iron from the nail' },
          ],
        },
        scenario: {
          id: 's5',
          type: 'scenario',
          prompt:
            'Why is gold found in nature in pure form more often than iron?',
          correctChoiceId: 's5-b',
          explanation:
            'Gold is much less reactive, so it is less likely to be found combined with other substances.',
          options: [
            { id: 's5-a', label: 'Because gold is lighter than iron' },
            {
              id: 's5-b',
              label:
                'Because gold is much less reactive and does not combine easily with other substances',
            },
            { id: 's5-c', label: 'Because gold is a non-metal' },
          ],
        },
      },
      {
        id: 'topic-06',
        title: 'Ionic Compounds and Extraction',
        timestampLabel: '2:50',
        startSeconds: 170,
        endSeconds: 212,
        mission:
          'Connect ionic bonding and metal extraction to everyday products and energy use.',
        sourceAnchor: 'NCERT Ch. 3 - Sections 3.4 and 3.5, Pages 47-51',
        quiz: {
          id: 'q6',
          type: 'mcq',
          prompt:
            'Why is aluminium extracted by electrolysis instead of heating with carbon?',
          correctChoiceId: 'q6-b',
          explanation:
            'Aluminium is more reactive than carbon, so carbon cannot reduce it from its compound.',
          options: [
            { id: 'q6-a', label: 'Because aluminium is too soft to heat' },
            {
              id: 'q6-b',
              label:
                'Because aluminium is more reactive than carbon, so carbon cannot reduce it',
            },
            { id: 'q6-c', label: 'Because aluminium always melts before reacting' },
          ],
        },
        scenario: {
          id: 's6',
          type: 'scenario',
          prompt:
            'Why are aluminium cans expensive to produce even though aluminium is abundant in the Earth\'s crust?',
          correctChoiceId: 's6-b',
          explanation:
            'Extracting aluminium requires electrolysis, which uses a lot of electrical energy.',
          options: [
            { id: 's6-a', label: 'Because aluminium is difficult to shape' },
            {
              id: 's6-b',
              label:
                'Because extracting aluminium requires electrolysis, which uses a lot of electricity',
            },
            { id: 's6-c', label: 'Because aluminium ore is always imported' },
          ],
        },
      },
    ],
  },
};

export function getChapterSyllabus(chapterKey: string) {
  return chapterSyllabusCatalog[chapterKey];
}
