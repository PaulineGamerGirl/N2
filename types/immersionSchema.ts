
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
  baseForm?: string;
  romaji?: string;
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
  meaning: string;
  grammar_analysis: string;
  isTarget: boolean; 
  jlptLevel?: string; 
  // Fix: Added missing frequencyRank property to resolve type errors in components
  frequencyRank?: string;
}

export interface ExplanationCard {
  segments: BreakdownSegment[];
  naturalTranslation: string; 
  visualLogic: string; // New field for diagram description
}

export interface MinedCard {
  id: string;
  sourceTitle: string; 
  sourceEpisode?: number; 
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
  progress: number; 
  phase: 'Queued' | 'Audio Sync' | 'Translating' | 'Cooling Down' | 'Finalizing' | 'Done' | 'Failed';
  details?: string; 
  error?: string;
}