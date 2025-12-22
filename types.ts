
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Stats {
  vocab: number;
  vocabGoal: number;
  immersionHours: number;
  immersionGoal: number;
  grammarPoints: number;
  streak: number;
}

export interface QuestPhase {
  id: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'locked';
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export type View = 'dashboard' | 'questmap' | 'inventory' | 'syntax' | 'messenger' | 'activity';

export interface LogData {
  vocabAdded: number;
  immersionTime: number;
  grammarPoints: number;
}

export type ExamMode = 'GRAMMAR' | 'READING' | 'VOCAB';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic?: string; 
}

export type ActivityCategory = 'OUTPUT' | 'GRAMMAR' | 'IMMERSION' | 'ANKI';

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  category: ActivityCategory;
  durationMinutes: number;
  summary: string;
}
