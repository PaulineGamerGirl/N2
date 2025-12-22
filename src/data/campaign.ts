import { QuestPhase } from '../types';

// Adjusted to 2024/2025 cycle to align with "Phase 1 Completed" status relative to current real-time (early 2025).
// If we used 2025/2026, everything would be "Locked" and the Dashboard would show "Pre-Game".
export const CAMPAIGN_PHASES: QuestPhase[] = [
  {
    id: 1,
    title: "Phase 1: Foundation",
    subtitle: "Hiragana, Katakana, N5/N4",
    status: 'completed', // Logic will override, but this serves as metadata
    description: "The bedrock of your journey. Basic syntax and survival vocabulary acquired.",
    startDate: '2024-09-01',
    endDate: '2024-10-26'
  },
  {
    id: 2,
    title: "Phase 2: The Climb",
    subtitle: "N3 Grammar & N2 Vocab",
    status: 'current',
    description: "Bridging the gap between textbook and native material. The grind begins here.",
    startDate: '2024-11-19',
    endDate: '2025-01-20'
  },
  {
    id: 3,
    title: "Phase 3: Mastery",
    subtitle: "Quartet II & Authentic Content",
    status: 'locked',
    description: "Complete immersion. Understanding news, novels, and fast-paced dialogue.",
    startDate: '2025-01-21',
    endDate: '2025-06-01'
  },
  {
    id: 4,
    title: "Phase 4: Final Boss",
    subtitle: "JLPT N2 Final Prep",
    status: 'locked',
    description: "Mock exams and weakness targeting. The final hurdle before ascension.",
    startDate: '2025-06-02',
    endDate: '2025-07-01'
  },
];

export const TARGET_DATE = new Date('2025-07-06'); // JLPT N2 Date