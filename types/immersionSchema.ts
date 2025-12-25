
export enum TokenType {
  /** Nouns, Verb roots, Adjectives - The semantic "meat" of the sentence */
  CONTENT = 'CONTENT',
  /** Particles, Conjugations, Auxiliaries - The structural "skeleton" */
  GRAMMAR = 'GRAMMAR',
  /** Commas, periods, brackets */
  PUNCTUATION = 'PUNCTUATION'
}

export interface ImmersionToken {
  /** The original text snippet */
  text: string;
  /** Reading for Japanese tokens */
  romaji?: string;
  /** Categorization for styling (e.g. solid vs translucent) */
  type: TokenType;
  /** 
   * The "Magic Link". 
   * Tokens in JP and EN with the same groupId represent the same concept.
   */
  groupId: number;
}

export interface DialogueNode {
  /** Unique ID for referencing/scrolling */
  id: string;
  /** Start time in the video (seconds) */
  timestampStart: number;
  /** End time in the video (seconds) */
  timestampEnd: number;
  /** Character name */
  speaker: string;
  /** Tokenized Japanese sentence */
  japanese: ImmersionToken[];
  /** Tokenized English translation */
  english: ImmersionToken[];
  /** Scribe's notes on tricky nuances within this specific node */
  grammarNotes: string[];
}

export interface VideoAnalysis {
  /** Linked internal video ID */
  videoId: string;
  /** Human readable title */
  title: string;
  /** Array of synchronized dialogue events */
  nodes: DialogueNode[];
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
  particle?: {
    text: string;
    function: string;
  };
  nuance: {
    jlptLevel: string;
    explanation: string;
  };
  naturalTranslation: string;
}
