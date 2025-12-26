
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
  subtitleOffset?: number; // Added to persist timing adjustments
}

export interface ExplanationCard {
  headword: {
    text: string;
    romaji: string;
    basicMeaning: string;
  };
  analysis: {
    baseForm: string;
    conjugationPath: string[];
    breakdown: string;
  };
  nuance: {
    jlptLevel: string;
    explanation: string;
  };
  naturalTranslation: string;
}

export interface MinedCard {
  id: string;
  sourceTitle: string; 
  front: string; 
  back: string;  
  translation: string; 
  fullTranslation: string; 
  image: string; 
  audio: string; 
  timestamp: number;
}
