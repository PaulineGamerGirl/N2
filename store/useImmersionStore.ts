
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { VideoAnalysis } from '../types/immersionSchema';
import { format, addHours } from 'date-fns';
import { useProgressStore } from './progressStore';

interface SessionStats {
  totalSecondsWatched: number;
  nodesCompleted: number;
}

type LayoutMode = 'split' | 'stacked';

interface ImmersionState {
  // Persistent Data
  playlist: VideoAnalysis[];
  isTranslationVisible: boolean;
  autoScrollEnabled: boolean;
  layoutMode: LayoutMode;
  
  // In-Memory Data
  activeIndex: number;
  videoSources: Record<string, string>; 
  sessionStats: SessionStats;
  isAnalyzing: boolean;

  // Actions
  addAnalyzedVideo: (videoFile: File, analysis: VideoAnalysis) => void;
  clearPlaylist: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
  nextScene: () => void;
  prevScene: () => void;
  setActiveIndex: (index: number) => void;
  toggleTranslation: () => void;
  recordWatchTime: (seconds: number, videoId: string) => void;
  setIsAnalyzing: (loading: boolean) => void;
  
  // Helpers
  getVirtualDate: () => string;
}

export const useImmersionStore = create<ImmersionState>()(
  persist(
    (set, get) => ({
      playlist: [], // Initialize empty for Landing Screen behavior
      isTranslationVisible: false,
      autoScrollEnabled: true,
      layoutMode: 'split',
      activeIndex: 0,
      videoSources: {},
      isAnalyzing: false,
      sessionStats: {
        totalSecondsWatched: 0,
        nodesCompleted: 0,
      },

      getVirtualDate: () => {
        return format(addHours(new Date(), -6), 'yyyy-MM-dd');
      },

      setLayoutMode: (layoutMode) => set({ layoutMode }),
      
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

      addAnalyzedVideo: (videoFile, analysis) => {
        const videoUrl = URL.createObjectURL(videoFile);
        const videoId = analysis.videoId || crypto.randomUUID();
        
        set((state) => ({
          playlist: [{ ...analysis, videoId }, ...state.playlist],
          videoSources: { ...state.videoSources, [videoId]: videoUrl },
          activeIndex: 0 // Jump to the new video
        }));
      },

      clearPlaylist: () => {
        set({ playlist: [], activeIndex: 0, videoSources: {} });
      },

      setActiveIndex: (index) => {
        const playlistLen = get().playlist.length;
        if (playlistLen === 0) return;
        set({ activeIndex: Math.max(0, Math.min(index, playlistLen - 1)) });
      },

      nextScene: () => {
        const { activeIndex, playlist } = get();
        if (activeIndex < playlist.length - 1) {
          set({ activeIndex: activeIndex + 1 });
        }
      },

      prevScene: () => {
        const { activeIndex } = get();
        if (activeIndex > 0) {
          set({ activeIndex: activeIndex - 1 });
        }
      },

      toggleTranslation: () => {
        set((state) => ({ isTranslationVisible: !state.isTranslationVisible }));
      },

      recordWatchTime: (seconds, videoId) => {
        const { sessionStats } = get();
        set({
          sessionStats: {
            ...sessionStats,
            totalSecondsWatched: sessionStats.totalSecondsWatched + seconds
          }
        });
        
        // Sync with global progress if needed
        // logic for logging XP could go here
      }
    }),
    {
      name: 'nihongo-nexus-immersion',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playlist: state.playlist,
        isTranslationVisible: state.isTranslationVisible,
        autoScrollEnabled: state.autoScrollEnabled,
        layoutMode: state.layoutMode,
      }),
    }
  )
);
