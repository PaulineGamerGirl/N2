import { QuestPhase } from '../types';

// Simulation Date: Dec 13, 2025
export const MOCK_CURRENT_DATE = new Date('2025-12-13T09:00:00');

export const CAMPAIGN_PHASES: QuestPhase[] = [
  {
    id: 1,
    title: "Phase 1: Foundation",
    subtitle: "Hiragana, Katakana, N5/N4",
    status: 'completed',
    description: "The bedrock of your journey. Basic syntax and survival vocabulary acquired.",
    startDate: '2025-09-01',
    endDate: '2025-10-26'
  },
  {
    id: 2,
    title: "Phase 2: The Climb",
    subtitle: "N3 Grammar & N2 Vocab",
    status: 'current',
    description: "Bridging the gap between textbook and native material. The grind begins here.",
    startDate: '2025-11-19',
    endDate: '2026-01-20'
  },
  {
    id: 3,
    title: "Phase 3: Mastery",
    subtitle: "Quartet II & Authentic Content",
    status: 'locked',
    description: "Complete immersion. Understanding news, novels, and fast-paced dialogue.",
    startDate: '2026-01-21',
    endDate: '2026-06-01'
  },
  {
    id: 4,
    title: "Phase 4: Final Boss",
    subtitle: "JLPT N2 Final Prep",
    status: 'locked',
    description: "Mock exams and weakness targeting. The final hurdle before ascension.",
    startDate: '2026-06-02',
    endDate: '2026-07-01'
  },
];

export const TARGET_DATE = new Date('2026-07-05T12:00:00'); // JLPT N2 Date 2026