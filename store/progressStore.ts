
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isYesterday, isToday } from 'date-fns';
import { parseAnkiExport, ParsedGrammarPoint } from '../utils/grammarParser';
import { ActivityLogEntry, ActivityCategory } from '../types';
import { seedData } from '../data/seedData';

interface LogEntry {
  id: string;
  date: string;
  vocab: number;
  immersion: number;
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
  rating: number;
  caption: string;
  durationOrVolumes: number;
  dateAdded: string;
  dateCompleted: string;
  showInTheater?: boolean;
  totalEpisodes?: number;
}

interface ProgressState {
  // --- VOCAB ENGINE V2 ---
  baseVocab: number;       // Fixed Baseline (2500)
  manualVocabCount: number; // Words from logs/legacy (1480)
  // -----------------------
  
  immersionMinutes: number;
  grammarPoints: number;
  streak: number;
  lastLogDate: string | null;
  logs: LogEntry[];
  masteredChapters: string[];
  grammarContext: string;
  grammarDatabase: Record<string, ParsedGrammarPoint[]>;
  dailyChecklist: Record<string, boolean>;
  completedDates: Record<string, boolean>;
  keepsakes: Keepsake[];
  activityLogs: ActivityLogEntry[];
  
  currentSessionStartTime: number | null;

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
  startImmersionSession: () => void;
  endImmersionSession: (summary: string) => number;
}

const STORAGE_KEY = 'nihongo-nexus-storage';

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      baseVocab: 2500,
      manualVocabCount: 1480, // Set to 1480 so Baseline(2500) + Manual(1480) = 3980
      immersionMinutes: 455,
      grammarPoints: 45,
      streak: 16,
      lastLogDate: null,
      logs: [],
      masteredChapters: [],
      grammarContext: '',
      grammarDatabase: {},
      dailyChecklist: {},
      completedDates: {
        "2025-12-22": true
      },
      keepsakes: [
        {
          id: "summer-hikaru-placeholder",
          title: "The Summer Hikaru Died",
          type: "ANIME",
          status: "ONGOING",
          coverUrl: "https://i.pinimg.com/736x/74/b5/4b/74b54b55d8c4972a5223df826861c9bb.jpg",
          rating: 0,
          caption: "",
          durationOrVolumes: 120, // 2 hours base
          dateAdded: new Date().toISOString().split('T')[0],
          dateCompleted: "",
          showInTheater: true,
          totalEpisodes: 12
        },
        {
          id: "death-note-placeholder",
          title: "Death Note",
          type: "ANIME",
          status: "ONGOING",
          coverUrl: "https://i.pinimg.com/736x/f3/c5/26/f3c5262b088541744643cf1bc2ad75fb.jpg",
          rating: 5,
          caption: "i am SEATED ohmygod so many plot twist",
          durationOrVolumes: 455,
          dateAdded: "2025-12-22",
          dateCompleted: "2025-12-22",
          showInTheater: true,
          totalEpisodes: 37
        }
      ],
      activityLogs: [
        {
          timestamp: 1766394194775,
          category: "IMMERSION",
          durationMinutes: 455,
          summary: "Immersed with Death Note for 455m",
          id: "a7e135ee-6d94-4dac-b0dd-fd9c52437c9a"
        }
      ],
      currentSessionStartTime: null,

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
          vocab, immersion, grammar
        };
        set({
          manualVocabCount: state.manualVocabCount + vocab,
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

      startImmersionSession: () => set({ currentSessionStartTime: Date.now() }),
      
      endImmersionSession: (summary) => {
        const { currentSessionStartTime } = get();
        if (!currentSessionStartTime) return 0;
        
        const now = Date.now();
        const diffMs = now - currentSessionStartTime;
        const minutes = Math.floor(diffMs / 60000);
        
        if (minutes > 0) {
          get().addActivityLog({
            timestamp: now,
            category: 'IMMERSION',
            durationMinutes: minutes,
            summary: `${summary} (Started at ${new Date(currentSessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
          });
          set(state => ({
            immersionMinutes: state.immersionMinutes + minutes,
            currentSessionStartTime: null
          }));
        } else {
          set({ currentSessionStartTime: null });
        }
        
        return minutes;
      },

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
          manualVocabCount: type === 'vocab' ? Math.max(0, state.manualVocabCount + valueChange) : state.manualVocabCount,
          grammarPoints: type === 'grammar' ? Math.max(0, state.grammarPoints + valueChange) : state.grammarPoints,
          immersionMinutes: type === 'immersion' ? Math.max(0, state.immersionMinutes + valueChange) : state.immersionMinutes,
        });
      },

      toggleDate: (dateStr: string) => {
        const state = get();
        const currentDates = { ...(state.completedDates || {}) };
        const isMarkingComplete = !currentDates[dateStr];
        
        if (isMarkingComplete) {
          currentDates[dateStr] = true;
        } else {
          delete currentDates[dateStr];
        }

        set({ completedDates: currentDates });
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
        baseVocab: 2500, manualVocabCount: 0, immersionMinutes: 0, grammarPoints: 0, streak: 0,
        lastLogDate: null, logs: [], masteredChapters: [], grammarContext: '',
        grammarDatabase: {}, dailyChecklist: {}, completedDates: {},
        keepsakes: [], activityLogs: [], currentSessionStartTime: null
      }),

      resetToSeed: () => {
        const incomingData = (seedData as any).data;
        if (!incomingData) return;
        const stateData = incomingData[STORAGE_KEY]?.state;
        if (stateData) {
          set(stateData);
          const fullState = { state: get(), version: (seedData as any).version || 9 };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
        }
        Object.keys(incomingData).forEach(key => {
          if (key !== STORAGE_KEY) {
            const val = incomingData[key];
            const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            localStorage.setItem(key, stringVal);
          }
        });
      }
    }),
    {
      name: STORAGE_KEY,
      version: 9,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version < 9) {
          const state = persistedState as ProgressState;
          const hikaruId = "summer-hikaru-placeholder";
          const existingIndex = state.keepsakes ? state.keepsakes.findIndex(k => k.id === hikaruId) : -1;

          const defaultHikaru = {
            id: hikaruId,
            title: "The Summer Hikaru Died",
            type: "ANIME" as const,
            status: "ONGOING" as const,
            coverUrl: "https://i.pinimg.com/736x/74/b5/4b/74b54b55d8c4972a5223df826861c9bb.jpg",
            rating: 0,
            caption: "",
            durationOrVolumes: 120, // 2 hours default
            dateAdded: new Date().toISOString().split('T')[0],
            dateCompleted: "",
            showInTheater: true,
            totalEpisodes: 12
          };

          if (existingIndex !== -1) {
            // SMART MERGE: Keep user's progress (duration, rating) but force structural updates (theater flag, image)
            const existing = state.keepsakes[existingIndex];
            state.keepsakes[existingIndex] = {
              ...defaultHikaru, // Apply defaults first
              ...existing,      // Overwrite with existing user data (preserves duration: 200, rating, etc)
              // Enforce critical updates that user might miss
              showInTheater: true,
              totalEpisodes: 12,
              coverUrl: "https://i.pinimg.com/736x/74/b5/4b/74b54b55d8c4972a5223df826861c9bb.jpg"
            };
          } else {
            // New Insert
            if (!state.keepsakes) state.keepsakes = [];
            state.keepsakes = [defaultHikaru, ...state.keepsakes];
          }
        }
        return persistedState;
      },
    }
  )
);
