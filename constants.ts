
import { QuestPhase, Stats } from './types';
// Fix: Added Variants type from framer-motion
import { Variants } from 'framer-motion';

export const INITIAL_STATS: Stats = {
  vocab: 4250,
  vocabGoal: 8000,
  immersionHours: 342,
  immersionGoal: 600,
  grammarPoints: 120,
  streak: 14,
};

// Playlist for Sidebar Memories Widget
export const SIDEBAR_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-studying-with-headphones-43033-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-hand-turning-the-pages-of-a-book-4648-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-cherry-blossom-tree-shaking-with-the-wind-43516-large.mp4'
];

export const MOTIVATIONAL_QUOTES = [
  "Limit Break your Vocab!",
  "Consistency is your strongest weapon.",
  "N2 is not a dream, it's a destination.",
  "Your neurons are leveling up.",
  "Don't let the kanji intimidate you.",
  "Immersion is the key to victory.",
];

// Framer Motion Variants
// Fix: Explicitly type containerVariants as Variants
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      duration: 0.5
    }
  }
};

// Fix: Explicitly type itemVariants as Variants to avoid string-to-AnimationGeneratorType mismatch
export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export const TARGET_DATE = new Date('2025-07-06'); // Next July JLPT roughly
