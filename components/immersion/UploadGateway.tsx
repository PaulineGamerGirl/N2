
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  CheckCircle2,
  FileVideo,
  FileText,
  Zap,
  MonitorPlay,
  Database,
  FileVideo as FileVideoIcon,
  AlertCircle,
  Layers,
  ArrowRight,
  RefreshCcw
} from 'lucide-react';
import { useImmersionStore } from '../../store/useImmersionStore';

interface TargetedEpisodes {
  seriesId: string;
  seriesTitle: string;
  episodeNumbers: number[];
}

interface UploadGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  targetEpisodes?: TargetedEpisodes | null; // New prop
}

const UploadGateway: React.FC<UploadGatewayProps> = ({ isOpen, onClose, targetEpisodes }) => {
  const [isDragging, setIsDragging] = useState<'video' | 'sub' | 'multi' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Standard Mode State
  const [cinemaVideos, setCinemaVideos] = useState<File[]>([]);
  const [cinemaSubs, setCinemaSubs] = useState<File[]>([]);

  // Batch Slot Mode State
  const [batchSlots, setBatchSlots] = useState<Record<number, { video?: File, srt?: File }>>({});

  const { 
    viewMode,
    activeSeriesId,
    activeEpisodeNumber,
    playlist,
    series,
    metadataHydratedIds,
    loadEpisodeMetadata,
    startBackgroundIngestion,
    addToQueue,
    addDetailedToQueue, // Use new action
    addAnalyzedVideo
  } = useImmersionStore();
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const multiInputRef = useRef<HTMLInputElement>(null);

  const isCinema = viewMode === 'cinema';
  const isLibraryMode = !!activeSeriesId && !!activeEpisodeNumber;
  const hasMetadataLoaded = playlist.length > 0;
  
  const epKey = isLibraryMode ? `${activeSeriesId}_ep_${activeEpisodeNumber}` : '';
  const isMountOnly = isLibraryMode && (hasMetadataLoaded || metadataHydratedIds.has(epKey));

  const selectedSeries = series.find(s => s.id === activeSeriesId);

  // --- SLOT HANDLERS ---
  const handleSlotFile = (epNum: number, type: 'video' | 'srt', file: File) => {
    setBatchSlots(prev => ({
      ...prev,
      [epNum]: {
        ...prev[epNum],
        [type]: file
      }
    }));
  };

  const handleBatchSlotSubmit = () => {
    if (!targetEpisodes) return;
    
    const itemsToQueue: { video: File, srt: File, seriesTitle: string, epNum: number }[] = [];
    
    targetEpisodes.episodeNumbers.forEach(epNum => {
      const slot = batchSlots[epNum];
      if (slot?.video && slot?.srt) {
        itemsToQueue.push({
          video: slot.video,
          srt: slot.srt,
          seriesTitle: targetEpisodes.seriesTitle,
          epNum: epNum
        });
      }
    });

    if (itemsToQueue.length === 0) {
      setError("Please fill at least one complete episode slot (Video + SRT).");
      return;
    }

    onClose();
    addDetailedToQueue(itemsToQueue);
  };

  // --- STANDARD HANDLERS ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(null);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    if (isMountOnly) {
      handleLibraryMount(files);
    } else {
      onClose();
      startBackgroundIngestion(files);
    }
  };

  const handleLibraryMount = async (files: FileList) => {
    if (files.length === 0) return;
    const file = files[0];
    
    let metadata = playlist[0];
    if (!metadata && isLibraryMode) {
       metadata = await loadEpisodeMetadata(activeSeriesId!, activeEpisodeNumber!);
    }
    
    if (metadata) {
       addAnalyzedVideo(file, metadata);
       onClose();
    } else {
       setError("The metadata for this episode couldn't be located in the vault.");
    }
  };

  const handleCinemaSubmit = async () => {
    if (cinemaVideos.length === 0 || cinemaSubs.length === 0) return;
    onClose();
    addToQueue(cinemaVideos, cinemaSubs);
  };

  const handleStandardFilesSelect = (files: FileList) => {
    onClose();
    startBackgroundIngestion(files);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-rose-950/20 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[90vh]" >
            
            <div className="p-8 border-b border-rose-50 bg-rose-50/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl text-rose-400 shadow-sm border border-rose-50">
                  {targetEpisodes ? <Layers className="w-6 h-6" /> : (isMountOnly ? <MonitorPlay className="w-6 h-6" /> : <Upload className="w-6 h-6" />)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-coquette-header text-gray-800 tracking-tight">
                    {targetEpisodes ? `Targeted Ingestion: ${targetEpisodes.seriesTitle}` : (isMountOnly ? 'MOUNT EPISODE binary' : (isCinema ? 'CINEMA SETUP' : 'MEDIA INGESTION'))}
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 font-bold mt-1">
                    {targetEpisodes ? 'Batch Checklist Mode' : (isMountOnly ? `LINKING TO: ${selectedSeries?.title} - CH ${activeEpisodeNumber}` : 'AUTO-SYNC & AI TRANSLATION')}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-rose-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {targetEpisodes ? (
                // --- TARGETED SLOT MODE ---
                <div className="space-y-6">
                  {targetEpisodes.episodeNumbers.map(epNum => {
                    const slot = batchSlots[epNum] || {};
                    const isComplete = slot.video && slot.srt;
                    
                    return (
                      <div key={epNum} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-rose-100'}`}>
                        <div className="w-16 flex flex-col items-center justify-center shrink-0">
                           <span className="text-2xl font-bold font-coquette-header text-gray-700">{epNum}</span>
                           <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Episode</span>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 gap-4">
                           {/* VIDEO SLOT - Expanded Acceptance */}
                           <label className={`
                              flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-rose-300 group
                              ${slot.video ? 'bg-white border-emerald-300 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'}
                           `}>
                              <input type="file" accept="video/*,.mkv,.mp4,.avi,.webm" className="hidden" onChange={(e) => e.target.files && handleSlotFile(epNum, 'video', e.target.files[0])} />
                              {slot.video ? (
                                <><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold truncate max-w-[120px]">{slot.video.name}</span></>
                              ) : (
                                <><FileVideoIcon className="w-4 h-4 group-hover:text-rose-400" /><span className="text-[10px] font-black uppercase tracking-wider group-hover:text-rose-400">Video Source</span></>
                              )}
                           </label>

                           {/* SRT SLOT - Removed Accept to show ALL FILES */}
                           <label className={`
                              flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-rose-300 group
                              ${slot.srt ? 'bg-white border-emerald-300 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'}
                           `}>
                              <input type="file" className="hidden" onChange={(e) => e.target.files && handleSlotFile(epNum, 'srt', e.target.files[0])} />
                              {slot.srt ? (
                                <><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold truncate max-w-[120px]">{slot.srt.name}</span></>
                              ) : (
                                <><FileText className="w-4 h-4 group-hover:text-rose-400" /><span className="text-[10px] font-black uppercase tracking-wider group-hover:text-rose-400">Subtitle Source</span></>
                              )}
                           </label>
                        </div>
                        
                        {/* Status Icon */}
                        <div className="w-8 flex items-center justify-center">
                           {isComplete ? <Zap className="w-5 h-5 text-emerald-500 fill-current" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4 flex justify-end">
                     <button 
                       onClick={handleBatchSlotSubmit}
                       className="px-8 py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-3 transition-all active:scale-95"
                     >
                       <Layers className="w-5 h-5" /> Engage Batch Process
                     </button>
                  </div>
                </div>
              ) : (
                // --- STANDARD MODE ---
                <div className="flex flex-col gap-6">
                  {isMountOnly ? (
                    <div 
                      onClick={() => videoInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging('video'); }}
                      onDragLeave={() => setIsDragging(null)}
                      onDrop={handleDrop}
                      className={`relative min-h-[300px] rounded-[32px] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group ${isDragging ? 'bg-rose-50 border-rose-400 scale-[0.99]' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}
                    >
                       <input type="file" ref={videoInputRef} onChange={(e) => e.target.files && handleLibraryMount(e.target.files)} className="hidden" accept="video/*,.mkv,.mp4,.avi,.webm" />
                       <div className="p-6 rounded-full bg-white shadow-xl text-rose-400 mb-6 border border-rose-50 group-hover:scale-110 transition-transform">
                          <FileVideoIcon className="w-12 h-12" />
                       </div>
                       <h3 className="text-2xl font-bold font-coquette-header text-gray-700 tracking-wide text-center">
                         Drop Episode File
                       </h3>
                       <p className="text-sm text-gray-400 font-coquette-body italic mt-2 text-center px-12">
                         "The metadata is already locked and loaded. Just provide the binary to begin immersion."
                       </p>
                       <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <Database className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Metadata Sync Ready</span>
                       </div>
                    </div>
                  ) : isCinema ? (
                    <div className="grid grid-cols-2 gap-4">
                      {/* MULTI-VIDEO INPUT - Broaden extensions */}
                      <div onClick={() => videoInputRef.current?.click()} className={`h-[240px] rounded-[32px] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${cinemaVideos.length > 0 ? 'bg-emerald-50/30 border-emerald-200' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}>
                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*,.mkv,.mp4,.avi,.webm" multiple onChange={(e) => e.target.files && setCinemaVideos(Array.from(e.target.files))} />
                        {cinemaVideos.length > 0 ? (
                          <div className="text-center p-4">
                            <Layers className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-xl font-bold text-gray-700">{cinemaVideos.length} Videos</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Ready for Sync</p>
                          </div>
                        ) : (
                          <div className="text-center px-4"><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-300"><FileVideoIcon className="w-5 h-5" /></div><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Video Batch</h4></div>
                        )}
                      </div>
                      
                      {/* MULTI-SRT INPUT - Remove accept to allow All Files */}
                      <div onClick={() => subInputRef.current?.click()} className={`h-[240px] rounded-[32px] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${cinemaSubs.length > 0 ? 'bg-emerald-50/30 border-emerald-200' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}>
                        <input type="file" ref={subInputRef} className="hidden" multiple onChange={(e) => e.target.files && setCinemaSubs(Array.from(e.target.files))} />
                        {cinemaSubs.length > 0 ? (
                          <div className="text-center p-4">
                            <Layers className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-xl font-bold text-gray-700">{cinemaSubs.length} Subtitles</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">JP Scripts</p>
                          </div>
                        ) : (
                          <div className="text-center px-4"><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-300"><FileText className="w-5 h-5" /></div><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle Batch</h4></div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => multiInputRef.current?.click()} className={`relative min-h-[300px] rounded-[32px] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group ${isDragging ? 'bg-rose-50 border-rose-400' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}>
                      <input type="file" ref={multiInputRef} onChange={(e) => e.target.files && handleStandardFilesSelect(e.target.files)} className="hidden" multiple accept="video/*,.mkv,.mp4,.avi,.webm" />
                      <div className="flex flex-col items-center flex-1 justify-center py-10">
                        <div className="p-5 rounded-full bg-white shadow-md text-rose-300 mb-6 border border-rose-50"><FileVideoIcon className="w-10 h-10" /></div>
                        <h3 className="text-xl font-bold font-coquette-header text-gray-700 tracking-wide uppercase tracking-[0.2em]">Drop Media</h3>
                      </div>
                    </div>
                  )}
                  {isCinema && !isMountOnly && (
                    <button 
                      disabled={cinemaVideos.length === 0 || cinemaSubs.length === 0} 
                      onClick={handleCinemaSubmit} 
                      className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${cinemaVideos.length > 0 && cinemaSubs.length > 0 ? 'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'}`}
                    >
                      <Zap className="w-5 h-5" /> 
                      {cinemaVideos.length > 1 ? `Batch Process (${Math.min(cinemaVideos.length, cinemaSubs.length)} Episodes)` : 'Initialize Neural Sync'}
                    </button>
                  )}
                </div>
              )}
              <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-500"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p className="text-xs font-bold leading-relaxed">{error}</p></motion.div>}</AnimatePresence>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-rose-50 text-center">
               <div className="flex items-center justify-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  <Database className="w-3 h-3" /> PERSISTENT METADATA VAULT ACTIVE
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadGateway;
