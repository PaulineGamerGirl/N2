import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isYesterday, isToday } from 'date-fns';
import { parseAnkiExport, ParsedGrammarPoint } from '../utils/grammarParser';
import { ActivityLogEntry, ActivityCategory } from '../types';
import { seedData } from '../data/seedData';

interface LogEntry {
  id: string;
  date: string; // ISO string
  vocab: number;
  immersion: number; // minutes
  grammar: number;
}

export type MediaType = 'ANIME' | 'MANGA' | 'GAME' | 'SHOW';
export type MediaStatus = 'ONGOING' | 'FINISHED';

export interface Keepsake {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  coverUrl: string;
  rating: number; // 1-5
  caption: string;
  durationOrVolumes: number; // Minutes for Anime/Game/Show, Count for Manga
  dateAdded: string; // When the record was created
  dateCompleted: string; // When the user actually finished it
}

interface ProgressState {
  vocabCount: number;
  immersionMinutes: number;
  grammarPoints: number;
  streak: number;
  lastLogDate: string | null;
  logs: LogEntry[];
  
  // Syntax Archive State
  masteredChapters: string[];
  grammarContext: string;
  grammarDatabase: Record<string, ParsedGrammarPoint[]>;

  // Coquette Calendar State
  dailyChecklist: Record<string, boolean>;
  completedDates: Record<string, boolean>;

  // Keepsakes State
  keepsakes: Keepsake[];

  // Activity Log State
  activityLogs: ActivityLogEntry[];

  // Actions
  addLog: (vocab: number, immersion: number, grammar: number) => void;
  resetProgress: () => void;
  resetToSeed: () => void;
  toggleChapter: (id: string) => void;
  setModuleChapters: (ids: string[], isSelected: boolean) => void;
  setGrammarContext: (text: string) => void;
  importGrammar: (text: string) => number;
  toggleDailyTask: (dateStr: string, taskId: string, type: 'vocab' | 'grammar' | 'immersion', value: number) => void;
  toggleDate: (dateStr: string) => void;
  addKeepsake: (item: Keepsake) => void;
  updateKeepsake: (id: string, updates: Partial<Keepsake>) => void;
  removeKeepsake: (id: string) => void;
  addMinutesToKeepsake: (id: string, minutes: number) => void;
  addActivityLog: (entry: Omit<ActivityLogEntry, 'id'>) => void;
}

const STORAGE_KEY = 'nihongo-nexus-storage';

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      // Default Initial State
      vocabCount: 2500, 
      immersionMinutes: 0,
      grammarPoints: 0,
      streak: 0,
      lastLogDate: null,
      logs: [],
      masteredChapters: [],
      grammarContext: '',
      grammarDatabase: {},
      dailyChecklist: {},
      completedDates: {},
      keepsakes: [],
      activityLogs: [],

      addLog: (vocab, immersion, grammar) => {
        const state = get();
        const now = new Date();
        let newStreak = state.streak;
        if (state.lastLogDate) {
          const lastDate = new Date(state.lastLogDate);
          if (isYesterday(lastDate)) newStreak += 1;
          else if (!isToday(lastDate)) newStreak = 1; 
        } else {
           newStreak = 1;
        }

        const newLog: LogEntry = {
          id: crypto.randomUUID(),
          date: now.toISOString(),
          vocab,
          immersion,
          grammar
        };

        set({
          vocabCount: state.vocabCount + vocab,
          immersionMinutes: state.immersionMinutes + immersion,
          grammarPoints: state.grammarPoints + grammar,
          streak: newStreak,
          lastLogDate: now.toISOString(),
          logs: [newLog, ...state.logs]
        });
      },

      addActivityLog: (entry) => set(state => ({
        activityLogs: [{ ...entry, id: crypto.randomUUID() }, ...state.activityLogs]
      })),

      toggleChapter: (id) => {
        const state = get();
        const exists = state.masteredChapters.includes(id);
        set({
          masteredChapters: exists
            ? state.masteredChapters.filter(c => c !== id)
            : [...state.masteredChapters, id]
        });
      },

      setModuleChapters: (ids, isSelected) => {
        const state = get();
        const current = new Set(state.masteredChapters);
        if (isSelected) ids.forEach(id => current.add(id));
        else ids.forEach(id => current.delete(id));
        set({ masteredChapters: Array.from(current) });
      },

      setGrammarContext: (text) => set({ grammarContext: text }),

      importGrammar: (text) => {
        const parsedData = parseAnkiExport(text);
        let totalImported = 0;
        const currentDb = get().grammarDatabase;
        const newDb = { ...currentDb };
        Object.entries(parsedData).forEach(([chapterId, points]) => {
            newDb[chapterId] = points;
            totalImported += points.length;
        });
        set({ grammarDatabase: newDb, grammarContext: text });
        return totalImported;
      },

      toggleDailyTask: (dateStr, taskId, type, value) => {
        const state = get();
        const fullKey = `${dateStr}-${taskId}`;
        const isCurrentlyDone = !!state.dailyChecklist[fullKey];
        const modifier = isCurrentlyDone ? -1 : 1;
        const valueChange = value * modifier;
        set({
          dailyChecklist: { ...state.dailyChecklist, [fullKey]: !isCurrentlyDone },
          vocabCount: type === 'vocab' ? Math.max(0, state.vocabCount + valueChange) : state.vocabCount,
          grammarPoints: type === 'grammar' ? Math.max(0, state.grammarPoints + valueChange) : state.grammarPoints,
          immersionMinutes: type === 'immersion' ? Math.max(0, state.immersionMinutes + valueChange) : state.immersionMinutes,
        });
      },

      toggleDate: (dateStr: string) => {
        const state = get();
        const currentDates = state.completedDates || {};
        const newCompletedDates = { ...currentDates };
        if (newCompletedDates[dateStr]) delete newCompletedDates[dateStr];
        else newCompletedDates[dateStr] = true;
        set({
          completedDates: newCompletedDates
        });
      },
      
      addKeepsake: (item) => set(state => ({ keepsakes: [item, ...state.keepsakes] })),
      updateKeepsake: (id, updates) => set(state => ({
        keepsakes: state.keepsakes.map(item => item.id === id ? { ...item, ...updates } : item)
      })),
      removeKeepsake: (id) => set(state => ({ keepsakes: state.keepsakes.filter(item => item.id !== id) })),
      
      addMinutesToKeepsake: (id, minutes) => set(state => ({
        keepsakes: state.keepsakes.map(item => 
          item.id === id ? { ...item, durationOrVolumes: (item.durationOrVolumes || 0) + minutes } : item
        )
      })),

      resetProgress: () => set({ 
        vocabCount: 2500, 
        immersionMinutes: 0, 
        grammarPoints: 0, 
        streak: 0, 
        lastLogDate: null, 
        logs: [],
        masteredChapters: [],
        grammarContext: '',
        grammarDatabase: {},
        dailyChecklist: {},
        completedDates: {},
        keepsakes: [],
        activityLogs: []
      }),

      resetToSeed: () => {
        // Updated to handle the nested structure of your actual backup data
        const stateData = (seedData as any).data?.['nihongo-nexus-storage']?.state;
        if (stateData) {
          set(stateData);
          // Ensure changes persist immediately
          const fullState = { state: get(), version: (seedData as any).version || 7 };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
        } else {
          console.error("Seed data state not found. Please check data/seedData.ts structure.");
        }
      }
    }),
    {
      name: STORAGE_KEY,
      version: 7,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        const hasStorage = !!localStorage.getItem(STORAGE_KEY);
        if (!hasStorage) {
          return (hydratedState) => {
            if (hydratedState) {
              hydratedState.resetToSeed();
            }
          };
        }
      }
    }
  )
);
