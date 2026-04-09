export interface PathField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea";
}

export interface PathInfo {
  number: number;
  name: string;
  sephira: string;
  symbol: string;
  theme: string;
  description: string;
  fields: PathField[];
  outputLabel: string;
  points: number;
  colorClass: string; // Earth → Gold → White gradient
}

export const PATHS: PathInfo[] = [
  {
    number: 1,
    name: "Self Knowledge",
    sephira: "Malkuth",
    symbol: "🌍",
    theme: "Awareness of self",
    description: "Begin your journey by discovering your Ikigai — the intersection of passion, skill, purpose, and livelihood.",
    fields: [
      { key: "love", label: "What do you love?", placeholder: "Activities, topics, and things that light you up…", type: "textarea" },
      { key: "good_at", label: "What are you good at?", placeholder: "Skills, talents, and abilities…", type: "textarea" },
      { key: "world_needs", label: "What does the world need?", placeholder: "Problems you can solve, needs you can fill…", type: "textarea" },
      { key: "paid_for", label: "What can you be paid for?", placeholder: "Services, products, or value you can exchange…", type: "textarea" },
      { key: "ikigai_statement", label: "Your Ikigai Statement", placeholder: "Combine your answers into one guiding statement…", type: "textarea" },
    ],
    outputLabel: "Personal Ikigai Statement",
    points: 50,
    colorClass: "from-amber-900 to-amber-800",
  },
  {
    number: 2,
    name: "Goal Structuring",
    sephira: "Yesod",
    symbol: "🌙",
    theme: "Clarity of intention",
    description: "Build a structured blueprint for your most important goal with clear steps and honest assessment.",
    fields: [
      { key: "goal", label: "What do you want to achieve?", placeholder: "Define your goal clearly…", type: "textarea" },
      { key: "benefits", label: "Benefits of your goal?", placeholder: "What will achieving this bring you?", type: "textarea" },
      { key: "obstacles", label: "Obstacles?", placeholder: "What stands in your way?", type: "textarea" },
      { key: "solutions", label: "Solutions?", placeholder: "How will you overcome each obstacle?", type: "textarea" },
      { key: "steps", label: "Step-by-step process", placeholder: "Break it into actionable steps…", type: "textarea" },
      { key: "worth_it", label: "Is your goal worth your time?", placeholder: "If not, choose another goal. Explain your reasoning…", type: "textarea" },
      { key: "completion_date", label: "Completion date", placeholder: "When will you complete this?", type: "text" },
    ],
    outputLabel: "Structured Goal Blueprint",
    points: 50,
    colorClass: "from-amber-800 to-amber-700",
  },
  {
    number: 3,
    name: "Mental Framework",
    sephira: "Hod",
    symbol: "📐",
    theme: "Thought systems",
    description: "Map your cognitive chain based on your goal — trace how thoughts become intuition.",
    fields: [
      { key: "thought", label: "Thought", placeholder: "What is the initial thought about your goal?", type: "textarea" },
      { key: "emotion", label: "Emotion", placeholder: "What emotion does this thought trigger?", type: "textarea" },
      { key: "belief", label: "Belief", placeholder: "What belief does this emotion reinforce?", type: "textarea" },
      { key: "confirmation", label: "Confirmation", placeholder: "What confirms this belief in your experience?", type: "textarea" },
      { key: "trust", label: "Trust", placeholder: "How does this build trust in yourself?", type: "textarea" },
      { key: "reinforced_belief", label: "Reinforced Belief", placeholder: "How has this belief been strengthened?", type: "textarea" },
      { key: "intuition", label: "Intuition", placeholder: "What intuitive knowing emerges from this chain?", type: "textarea" },
    ],
    outputLabel: "Personal Cognitive Map",
    points: 50,
    colorClass: "from-amber-700 to-yellow-700",
  },
  {
    number: 4,
    name: "First Principles",
    sephira: "Netzach",
    symbol: "⚡",
    theme: "Breaking assumptions",
    description: "Strip away assumptions and define the fundamental truths that guide your life and work.",
    fields: [
      { key: "personal_principles", label: "Personal First Principles (Life)", placeholder: "What are the non-negotiable truths that guide your personal life?", type: "textarea" },
      { key: "professional_principles", label: "Professional First Principles (Career/Business)", placeholder: "What fundamental truths drive your career or business decisions?", type: "textarea" },
      { key: "assumptions_broken", label: "Assumptions you're breaking", placeholder: "What beliefs did you hold that aren't actually true?", type: "textarea" },
    ],
    outputLabel: "First Principles Framework",
    points: 50,
    colorClass: "from-yellow-700 to-yellow-600",
  },
  {
    number: 5,
    name: "Transformation",
    sephira: "Tiphereth",
    symbol: "☀️",
    theme: "Inner alchemy",
    description: "Apply the 7 alchemical processes to transform yourself from within.",
    fields: [
      { key: "calcination", label: "Calcination — What must burn away?", placeholder: "Ego, false beliefs, or habits to destroy…", type: "textarea" },
      { key: "dissolution", label: "Dissolution — What must dissolve?", placeholder: "Rigid structures or emotional barriers to release…", type: "textarea" },
      { key: "separation", label: "Separation — What must be filtered?", placeholder: "Separate what serves you from what doesn't…", type: "textarea" },
      { key: "conjunction", label: "Conjunction — What must merge?", placeholder: "Combine your strengths, insights, and purpose…", type: "textarea" },
      { key: "fermentation", label: "Fermentation — What must grow?", placeholder: "What new life is emerging from the transformation?", type: "textarea" },
      { key: "distillation", label: "Distillation — What is the essence?", placeholder: "Purify your vision to its purest form…", type: "textarea" },
      { key: "coagulation", label: "Coagulation — What solidifies?", placeholder: "The new you that has formed through this process…", type: "textarea" },
    ],
    outputLabel: "Personal Transformation Map",
    points: 60,
    colorClass: "from-yellow-600 to-yellow-500",
  },
  {
    number: 6,
    name: "Power",
    sephira: "Geburah",
    symbol: "🔥",
    theme: "Discipline & strength",
    description: "Identify your personal power, acknowledge where you lack control, and build a system of self-command.",
    fields: [
      { key: "personal_power", label: "Identify your personal power", placeholder: "What gives you strength and influence?", type: "textarea" },
      { key: "lack_control", label: "Where do you lack control?", placeholder: "Areas where discipline or focus is missing…", type: "textarea" },
      { key: "command_system", label: "Your self-command system", placeholder: "Rules, rituals, or structures to govern yourself…", type: "textarea" },
    ],
    outputLabel: "Personal Power Framework",
    points: 50,
    colorClass: "from-yellow-500 to-amber-400",
  },
  {
    number: 7,
    name: "Time Intelligence",
    sephira: "Chesed",
    symbol: "🕰️",
    theme: "Expansion through timing",
    description: "Map your goal into timelines with natural sequences and realistic pacing.",
    fields: [
      { key: "goal_timeline", label: "Map your goal into timelines", placeholder: "Break your goal into phases with timeframes…", type: "textarea" },
      { key: "natural_sequence", label: "Break into natural sequence", placeholder: "What must happen first, second, third?", type: "textarea" },
      { key: "time_lapses", label: "Define realistic time lapses", placeholder: "How long will each phase realistically take?", type: "textarea" },
    ],
    outputLabel: "Time-Based Execution Plan",
    points: 50,
    colorClass: "from-amber-400 to-yellow-300",
  },
  {
    number: 8,
    name: "Analysis",
    sephira: "Da'at",
    symbol: "👁️",
    theme: "Deep understanding",
    description: "Analyze your goal, plan, and self with brutal honesty. Find the gaps before they find you.",
    fields: [
      { key: "goal_analysis", label: "Analyze your goal", placeholder: "Is your goal still aligned with your Ikigai?", type: "textarea" },
      { key: "plan_analysis", label: "Analyze your plan", placeholder: "Are your steps realistic and complete?", type: "textarea" },
      { key: "self_analysis", label: "Analyze yourself", placeholder: "Are you prepared? What's missing?", type: "textarea" },
      { key: "gaps_risks", label: "Gaps, risks, and blind spots", placeholder: "What could go wrong? What are you not seeing?", type: "textarea" },
    ],
    outputLabel: "Strategic Analysis Report",
    points: 60,
    colorClass: "from-yellow-300 to-yellow-200",
  },
  {
    number: 9,
    name: "Association",
    sephira: "Binah",
    symbol: "🔗",
    theme: "Pattern recognition",
    description: "Connect your journey to patterns, people, and systems. See the invisible threads.",
    fields: [
      { key: "patterns", label: "Patterns you've noticed", placeholder: "Recurring themes in your journey so far…", type: "textarea" },
      { key: "people_systems", label: "People & systems connected to your goal", placeholder: "Who and what can support or accelerate your path?", type: "textarea" },
      { key: "action_outcomes", label: "Relationships between actions and outcomes", placeholder: "What actions produced the best results? Why?", type: "textarea" },
    ],
    outputLabel: "Associative Intelligence Map",
    points: 50,
    colorClass: "from-yellow-200 to-white",
  },
  {
    number: 10,
    name: "Decision",
    sephira: "Kether",
    symbol: "👑",
    theme: "Final alignment",
    description: "This is the crown. Make your decisive commitment and define the next step that starts everything.",
    fields: [
      { key: "commitment", label: "Your decisive commitment", placeholder: "What are you committing to, fully and finally?", type: "textarea" },
      { key: "next_action", label: "Your next immediate action", placeholder: "What is the very first thing you will do?", type: "text" },
      { key: "declaration", label: "Final declaration", placeholder: "Write a powerful statement of who you are becoming…", type: "textarea" },
    ],
    outputLabel: "Final Decision + Execution Trigger",
    points: 100,
    colorClass: "from-white to-yellow-100",
  },
];

export const QUEST_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
