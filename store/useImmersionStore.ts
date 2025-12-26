
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { VideoAnalysis, DialogueNode, MinedCard, Series, EpisodeMetadata } from '../types/immersionSchema';
import { dictionaryService } from '../services/dictionaryService';
import { analyzeImmersionMedia, enrichSubtitles } from '../services/immersionService';
import { getVideoMetadata, fileToBase64 } from '../utils/videoMetadata';
import { parseSRTFile } from '../utils/srtParser';
import { Keepsake } from './progressStore';

type LayoutMode = 'split' | 'stacked';
export type ViewMode = 'standard' | 'cinema';

interface GlobalNotification {
  show: boolean;
  message: string;
}

interface ImmersionState {
  // Library State
  series: Series[];
  activeSeriesId: string | null;
  activeEpisodeNumber: number | null;
  metadataHydratedIds: Set<string>; 
  isLibraryOpen: boolean;

  // Background Processing & Notifications
  isAnalyzing: boolean;
  globalNotification: GlobalNotification | null;
  dismissNotification: () => void;

  // Standard State
  playlist: VideoAnalysis[];
  minedCards: MinedCard[];
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  subtitleOffset: number;
  activeIndex: number;
  videoSources: Record<string, string>; 

  // Actions
  addSeries: (series: Series) => void;
  removeSeries: (id: string) => void;
  syncSeriesWithKeepsakes: (keepsakes: Keepsake[]) => void;
  setActiveSession: (seriesId: string | null, epNum: number | null) => void;
  loadEpisodeMetadata: (seriesId: string, epNum: number) => Promise<VideoAnalysis | null>;
  saveEpisodeMetadata: (seriesId: string, epNum: number, analysis: VideoAnalysis) => Promise<void>;
  markEpisodesAsHydrated: (seriesId: string, episodeNumbers: number[]) => void;
  setLibraryOpen: (isOpen: boolean) => void;
  
  // Background Extraction Logic
  startBackgroundIngestion: (files: FileList) => Promise<void>;
  startBackgroundCinemaSync: (video: File, srt: File, enSrt?: File) => Promise<void>;

  addAnalyzedVideo: (videoFile: File, analysis: VideoAnalysis) => void;
  setActiveIndex: (index: number) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSubtitleOffset: (offset: number) => void;
  updateVideoNodes: (videoId: string, nodes: DialogueNode[]) => void;
  clearPlaylist: () => void;
  setIsAnalyzing: (loading: boolean) => void;
  getSyncedNodes: () => DialogueNode[];
  addMinedCard: (card: MinedCard) => void;
}

export const useImmersionStore = create<ImmersionState>()(
  persist(
    (set, get) => ({
      series: [],
      activeSeriesId: null,
      activeEpisodeNumber: null,
      metadataHydratedIds: new Set(),
      isLibraryOpen: false,

      isAnalyzing: false,
      globalNotification: null,
      dismissNotification: () => set({ globalNotification: null }),

      playlist: [],
      minedCards: [],
      viewMode: 'standard',
      layoutMode: 'split',
      subtitleOffset: 0.0,
      activeIndex: 0,
      videoSources: {},

      getSyncedNodes: () => {
        const { playlist, activeIndex, subtitleOffset } = get();
        const activeVideo = playlist[activeIndex];
        if (!activeVideo) return [];
        return activeVideo.nodes.map(node => ({
          ...node,
          timestampStart: Math.max(0, node.timestampStart + subtitleOffset),
          timestampEnd: Math.max(0, node.timestampEnd + subtitleOffset)
        }));
      },

      startBackgroundIngestion: async (files: FileList) => {
        set({ isAnalyzing: true });
        try {
          const firstFile = files[0];
          const meta = await getVideoMetadata(firstFile);
          get().setLayoutMode(meta.height > meta.width ? 'split' : 'stacked');
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileMeta = await getVideoMetadata(file);
            const base64 = await fileToBase64(file);
            const analysis = await analyzeImmersionMedia(base64, file.type, fileMeta.duration);
            
            const seriesId = get().activeSeriesId;
            const epNum = get().activeEpisodeNumber;
            if (seriesId && epNum) {
              await get().saveEpisodeMetadata(seriesId, epNum, analysis);
            }

            get().addAnalyzedVideo(file, analysis);
          }

          set({ 
            isAnalyzing: false,
            globalNotification: { show: true, message: "Done Uploading! You can now watch!" }
          });
        } catch (e) {
          set({ isAnalyzing: false });
          console.error(e);
        }
      },

      startBackgroundCinemaSync: async (video: File, srt: File, enSrt?: File) => {
        set({ isAnalyzing: true });
        try {
          const rawJpNodes = await parseSRTFile(srt);
          let rawEnNodes = undefined;
          if (enSrt) {
            rawEnNodes = await parseSRTFile(enSrt);
          }

          const enrichedNodes = await enrichSubtitles(rawJpNodes, rawEnNodes);
          
          const analysis = {
            videoId: crypto.randomUUID(),
            title: video.name.replace(/\.[^/.]+$/, ""),
            nodes: enrichedNodes
          };

          const seriesId = get().activeSeriesId;
          const epNum = get().activeEpisodeNumber;
          if (seriesId && epNum) {
            await get().saveEpisodeMetadata(seriesId, epNum, analysis);
          }

          get().addAnalyzedVideo(video, analysis);
          
          set({ 
            isAnalyzing: false,
            globalNotification: { show: true, message: "Done Uploading! You can now watch!" }
          });
        } catch (e) {
          set({ isAnalyzing: false });
          console.error(e);
        }
      },

      addSeries: (newSeries) => set(state => {
        const exists = state.series.some(s => s.id === newSeries.id);
        if (exists) {
          return { series: state.series.map(s => s.id === newSeries.id ? newSeries : s) };
        }
        return { series: [...state.series, newSeries] };
      }),

      removeSeries: (id) => set(state => ({ series: state.series.filter(s => s.id !== id) })),
      
      syncSeriesWithKeepsakes: (keepsakes) => set(state => {
        const theaterKeepsakes = keepsakes.filter(k => k.showInTheater && k.type === 'ANIME');
        const newSeriesList = [...state.series];
        theaterKeepsakes.forEach(k => {
          if (!newSeriesList.some(s => s.id === k.id)) {
            newSeriesList.push({
              id: k.id, title: k.title, totalEpisodes: k.totalEpisodes || 24, coverUrl: k.coverUrl
            });
          }
        });
        return { series: newSeriesList };
      }),

      setActiveSession: (seriesId, epNum) => set({ 
        activeSeriesId: seriesId, 
        activeEpisodeNumber: epNum,
        activeIndex: 0,
        isLibraryOpen: false,
        viewMode: 'cinema'
      }),

      setLibraryOpen: (isLibraryOpen) => set({ isLibraryOpen }),

      loadEpisodeMetadata: async (seriesId, epNum) => {
        const meta = await dictionaryService.getEpisodeMetadata(seriesId, epNum);
        if (meta) {
          set({
            playlist: [meta.analysis],
            activeIndex: 0,
            subtitleOffset: meta.subtitleOffset || 0
          });
          return meta.analysis;
        }
        return null;
      },

      saveEpisodeMetadata: async (seriesId, epNum, analysis) => {
        const offset = get().subtitleOffset;
        await dictionaryService.saveEpisodeMetadata({ 
          seriesId, 
          episodeNumber: epNum, 
          analysis,
          subtitleOffset: offset 
        });
        const key = `${seriesId}_ep_${epNum}`;
        set(state => {
          const nextSet = new Set(state.metadataHydratedIds);
          nextSet.add(key);
          return { metadataHydratedIds: nextSet };
        });
      },

      markEpisodesAsHydrated: (seriesId, episodeNumbers) => {
        set(state => {
          const nextSet = new Set(state.metadataHydratedIds);
          episodeNumbers.forEach(num => {
            nextSet.add(`${seriesId}_ep_${num}`);
          });
          return { metadataHydratedIds: nextSet };
        });
      },

      addAnalyzedVideo: (videoFile, analysis) => {
        const videoUrl = URL.createObjectURL(videoFile);
        const videoId = analysis.videoId || crypto.randomUUID();
        set((state) => ({
          playlist: [{ ...analysis, videoId }, ...state.playlist],
          videoSources: { ...state.videoSources, [videoId]: videoUrl },
          activeIndex: 0 
        }));
      },

      setActiveIndex: (index) => set({ activeIndex: index }),
      setViewMode: (viewMode) => set({ viewMode }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      setSubtitleOffset: (subtitleOffset) => set({ subtitleOffset }),
      updateVideoNodes: (videoId, nodes) => set(state => ({
        playlist: state.playlist.map(v => v.videoId === videoId ? { ...v, nodes } : v)
      })),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      addMinedCard: (card) => set(state => ({ minedCards: [card, ...state.minedCards] })),
      clearPlaylist: () => set({ playlist: [], activeIndex: 0, videoSources: {}, activeSeriesId: null, activeEpisodeNumber: null }),
    }),
    {
      name: 'nihongo-nexus-immersion-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        series: state.series,
        minedCards: state.minedCards,
        viewMode: state.viewMode,
        layoutMode: state.layoutMode,
        subtitleOffset: state.subtitleOffset,
        metadataHydratedIds: Array.from(state.metadataHydratedIds),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.metadataHydratedIds)) {
          state.metadataHydratedIds = new Set(state.metadataHydratedIds);
        }
      }
    }
  )
);
