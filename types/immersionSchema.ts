
export enum TokenType {
  /** Nouns, Verb roots, Adjectives - The semantic "meat" of the sentence */
  CONTENT = 'CONTENT',
  /** Particles, Conjugations, Auxiliaries - The structural "skeleton" */
  GRAMMAR = 'GRAMMAR',
  /** Commas, periods, brackets */
  PUNCTUATION = 'PUNCTUATION'
}

export interface ImmersionToken {
  text: string;
  romaji?: string;
  baseForm?: string;
  type: TokenType;
  groupId: number;
}

export interface DialogueNode {
  id: string;
  timestampStart: number;
  timestampEnd: number;
  speaker: string;
  japanese: ImmersionToken[];
  english: ImmersionToken[];
  grammarNotes: string[];
}

export interface VideoAnalysis {
  videoId: string;
  title: string;
  nodes: DialogueNode[];
}

export interface Series {
  id: string;
  title: string;
  totalEpisodes: number;
  coverUrl?: string;
  lastWatchedEpisode?: number;
}

export interface EpisodeMetadata {
  seriesId: string;
  episodeNumber: number;
  analysis: VideoAnalysis;
  subtitleOffset?: number;
}

export interface BreakdownSegment {
  japanese: string;
  romaji: string;
  meaning: string;
  grammar_analysis: string;
  isTarget: boolean; // True if this segment contains the word the user highlighted
  jlptLevel?: string; // Optional, can be derived or passed if needed
  frequencyRank?: string; // Optional
}

export interface ExplanationCard {
  segments: BreakdownSegment[];
  naturalTranslation: string; 
}

export interface MinedCard {
  id: string;
  sourceTitle: string; 
  sourceEpisode?: number; // Added for Anki tagging
  front: string; 
  back: string;  
  translation: string; 
  fullTranslation: string; 
  image: string; 
  audio: string; 
  timestamp: number;
}

export interface QueueItem {
  id: string;
  videoFile: File;
  srtFile: File;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  phase: 'Queued' | 'Audio Sync' | 'Translating' | 'Cooling Down' | 'Finalizing' | 'Done' | 'Failed';
  details?: string; // e.g., "Cooling down: 45s remaining"
  error?: string;
}
