
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { VideoAnalysis, DialogueNode, MinedCard, Series, QueueItem } from '../types/immersionSchema';
import { dictionaryService } from '../services/dictionaryService';
import { analyzeImmersionMedia, enrichSubtitles, getAudioSample, calculateSubtitleOffset } from '../services/immersionService';
import { getVideoMetadata, fileToBase64 } from '../utils/videoMetadata';
import { parseSRTFile } from '../utils/srtParser';
import { Keepsake } from './progressStore';
import { opfsService } from '../services/opfsService';

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

  // Background Processing & Queue
  isAnalyzing: boolean;
  isProcessingQueue: boolean;
  ingestionQueue: QueueItem[];
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
  deleteEpisode: (seriesId: string, epNum: number) => Promise<void>;
  markEpisodesAsHydrated: (seriesId: string, episodeNumbers: number[]) => void;
  setLibraryOpen: (isOpen: boolean) => void;
  
  // Queue Actions
  addToQueue: (videos: File[], srts: File[]) => void;
  addDetailedToQueue: (items: { video: File, srt: File, seriesTitle: string, epNum: number }[]) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  removeFromQueue: (id: string) => void;

  // Legacy/Single Actions
  startBackgroundIngestion: (files: FileList) => Promise<void>;
  
  addAnalyzedVideo: (videoFile: File, analysis: VideoAnalysis, seriesId?: string, epNum?: number) => void;
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
      series: [
        {
          id: "summer-hikaru-placeholder",
          title: "The Summer Hikaru Died",
          totalEpisodes: 12,
          coverUrl: "https://i.pinimg.com/736x/74/b5/4b/74b54b55d8c4972a5223df826861c9bb.jpg"
        },
        {
          id: "death-note-placeholder",
          title: "Death Note",
          totalEpisodes: 37,
          coverUrl: "https://i.pinimg.com/736x/f3/c5/26/f3c5262b088541744643cf1bc2ad75fb.jpg"
        }
      ],
      activeSeriesId: null,
      activeEpisodeNumber: null,
      metadataHydratedIds: new Set(),
      isLibraryOpen: false,

      isAnalyzing: false,
      isProcessingQueue: false,
      ingestionQueue: [],
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

      addToQueue: (videos, srts) => {
        const sortedVideos = [...videos].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const sortedSrts = [...srts].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const newItems: QueueItem[] = [];
        
        sortedVideos.forEach((video, idx) => {
          const srt = sortedSrts[idx];
          if (srt) {
            newItems.push({
              id: crypto.randomUUID(),
              videoFile: video,
              srtFile: srt,
              title: video.name.replace(/\.[^/.]+$/, ""),
              status: 'pending',
              progress: 0,
              phase: 'Queued'
            });
          }
        });

        set(state => ({ ingestionQueue: [...state.ingestionQueue, ...newItems] }));
        if (!get().isProcessingQueue) get().processQueue();
      },

      addDetailedToQueue: (items) => {
        const newItems: QueueItem[] = items.map(item => ({
          id: crypto.randomUUID(),
          videoFile: item.video,
          srtFile: item.srt,
          title: `${item.seriesTitle} - Ep ${item.epNum}`,
          status: 'pending',
          progress: 0,
          phase: 'Queued'
        }));

        set(state => ({ ingestionQueue: [...state.ingestionQueue, ...newItems] }));
        if (!get().isProcessingQueue) get().processQueue();
      },

      removeFromQueue: (id) => set(state => ({
        ingestionQueue: state.ingestionQueue.filter(item => item.id !== id)
      })),

      clearQueue: () => set({ ingestionQueue: [] }),

      processQueue: async () => {
        if (get().isProcessingQueue) return;
        set({ isProcessingQueue: true });

        while (true) {
          const state = get();
          const nextIdx = state.ingestionQueue.findIndex(q => q.status === 'pending');
          
          if (nextIdx === -1) {
            set({ isProcessingQueue: false });
            break; 
          }

          const item = state.ingestionQueue[nextIdx];
          const updateItem = (updates: Partial<QueueItem>) => {
            set(s => {
              const q = [...s.ingestionQueue];
              if (q[nextIdx]) q[nextIdx] = { ...q[nextIdx], ...updates };
              return { ingestionQueue: q };
            });
          };

          updateItem({ status: 'processing', phase: 'Audio Sync', progress: 5, details: 'Analyzing audio track...' });

          try {
            const rawNodes = await parseSRTFile(item.srtFile);
            
            // CRITICAL CHECK: If parser returned empty nodes, fail immediately.
            if (!rawNodes || rawNodes.length === 0) {
               throw new Error("SRT Parse Failed: No valid subtitles found. Check timestamp format (00:00:00,000).");
            }

            updateItem({ progress: 15 });

            const audioBase64 = await getAudioSample(item.videoFile);
            const firstFiveLines = rawNodes.slice(0, 5).map(n => ({
               text: n.japanese[0].text,
               start: n.timestampStart
            }));
            
            const offset = await calculateSubtitleOffset(audioBase64, firstFiveLines);
            updateItem({ phase: 'Translating', progress: 30, details: 'Enriching content with AI...' });

            const syncedNodes = rawNodes.map(n => ({
               ...n,
               timestampStart: n.timestampStart + offset,
               timestampEnd: n.timestampEnd + offset
            }));

            // Pass status callback to enrichSubtitles
            const enrichedNodes = await enrichSubtitles(syncedNodes, (pct, statusMsg) => {
               // Determine phase from message if possible, or keep Translating
               let phase: QueueItem['phase'] = 'Translating';
               if (statusMsg?.includes('Cooling')) phase = 'Cooling Down';
               
               updateItem({ 
                 phase, 
                 progress: 30 + Math.floor(pct * 0.6),
                 details: statusMsg
               });
            });

            const analysis = {
              videoId: crypto.randomUUID(),
              title: item.title,
              nodes: enrichedNodes
            };

            updateItem({ phase: 'Finalizing', progress: 95, details: 'Saving to vault...' });

            const epMatch = item.title.match(/(?:ep|episode|[_\s])(\d+)/i);
            const guessedEpNum = epMatch ? parseInt(epMatch[1]) : (state.activeEpisodeNumber ? state.activeEpisodeNumber + nextIdx : null);

            if (state.activeSeriesId && guessedEpNum) {
               await get().saveEpisodeMetadata(state.activeSeriesId, guessedEpNum, analysis);
               // OPFS Cache for this specific episode
               await opfsService.saveVideo(opfsService.getKey(state.activeSeriesId, guessedEpNum), item.videoFile);
            }

            get().addAnalyzedVideo(item.videoFile, analysis, state.activeSeriesId || undefined, guessedEpNum || undefined);

            updateItem({ status: 'completed', phase: 'Done', progress: 100, details: 'Ready for playback' });

            // CRITICAL: Cool down to prevent 429 errors from Google API
            await new Promise(resolve => setTimeout(resolve, 5000));

          } catch (error: any) {
            console.error("Queue Processing Error:", error);
            updateItem({ status: 'error', phase: 'Failed', error: error.message, details: error.message });
            // Add a small delay even on error to prevent rapid-fire loops
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
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
            get().addAnalyzedVideo(file, analysis);
          }
          set({ isAnalyzing: false });
        } catch (e) {
          set({ isAnalyzing: false });
        }
      },

      startBackgroundCinemaSync: async (video: File, srt: File) => {
         get().addToQueue([video], [srt]);
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
          // Metadata exists. Now try to recover the video "Ghost" from OPFS.
          const opfsKey = opfsService.getKey(seriesId, epNum);
          const cachedVideoFile = await opfsService.loadVideo(opfsKey);
          
          let videoUrl = '';
          if (cachedVideoFile) {
             videoUrl = URL.createObjectURL(cachedVideoFile);
             // We inject this recovered video source directly into state
             const videoId = meta.analysis.videoId;
             set(state => ({
               videoSources: { ...state.videoSources, [videoId]: videoUrl }
             }));
          }

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

      deleteEpisode: async (seriesId: string, epNum: number) => {
        await dictionaryService.deleteEpisodeMetadata(seriesId, epNum);
        // Also cleanup OPFS to free space
        await opfsService.deleteVideo(opfsService.getKey(seriesId, epNum));
        
        const key = `${seriesId}_ep_${epNum}`;
        set(state => {
          const nextSet = new Set(state.metadataHydratedIds);
          nextSet.delete(key);
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

      addAnalyzedVideo: (videoFile, analysis, seriesId, epNum) => {
        const videoUrl = URL.createObjectURL(videoFile);
        const videoId = analysis.videoId || crypto.randomUUID();
        
        // Save to OPFS if we have context
        if (seriesId && epNum) {
           opfsService.saveVideo(opfsService.getKey(seriesId, epNum), videoFile);
        }

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
      version: 2,
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
      },
      migrate: (persistedState: any, version) => {
        if (version < 2) {
          const state = persistedState as ImmersionState;
          const hikaruId = "summer-hikaru-placeholder";
          if (state.series && !state.series.some(s => s.id === hikaruId)) {
            state.series = [
              {
                id: hikaruId,
                title: "The Summer Hikaru Died",
                totalEpisodes: 12,
                coverUrl: "https://i.pinimg.com/736x/74/b5/4b/74b54b55d8c4972a5223df826861c9bb.jpg"
              },
              ...state.series
            ];
          }
        }
        return persistedState;
      }
    }
  )
);
