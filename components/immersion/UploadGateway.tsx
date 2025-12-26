
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Smartphone, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2,
  FileVideo,
  FileText,
  Zap,
  MonitorPlay,
  Database,
  Languages,
  Link,
  FileVideo as FileVideoIcon
} from 'lucide-react';
import { useImmersionStore } from '../../store/useImmersionStore';

interface UploadGatewayProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadGateway: React.FC<UploadGatewayProps> = ({ isOpen, onClose }) => {
  const [isDragging, setIsDragging] = useState<'video' | 'sub' | 'ensub' | 'multi' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [cinemaVideo, setCinemaVideoState] = useState<File | null>(null);
  const [cinemaSub, setCinemaSub] = useState<File | null>(null);
  const [cinemaEnSub, setCinemaEnSubState] = useState<File | null>(null);

  const { 
    viewMode,
    activeSeriesId,
    activeEpisodeNumber,
    playlist,
    series,
    metadataHydratedIds,
    loadEpisodeMetadata,
    startBackgroundIngestion,
    startBackgroundCinemaSync,
    addAnalyzedVideo,
    videoSources
  } = useImmersionStore();
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const enSubInputRef = useRef<HTMLInputElement>(null);
  const multiInputRef = useRef<HTMLInputElement>(null);

  const isCinema = viewMode === 'cinema';
  const isLibraryMode = !!activeSeriesId && !!activeEpisodeNumber;
  const hasMetadataLoaded = playlist.length > 0;
  
  // FIX: Also check the vault (metadataHydratedIds) to prevent race conditions 
  // where the modal opens before the playlist state has finished updating from DB.
  const epKey = isLibraryMode ? `${activeSeriesId}_ep_${activeEpisodeNumber}` : '';
  const isMountOnly = isLibraryMode && (hasMetadataLoaded || metadataHydratedIds.has(epKey));

  const selectedSeries = series.find(s => s.id === activeSeriesId);

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
    
    // Robust resolution: try current playlist first, then try loading from DB directly
    let metadata = playlist[0];
    
    if (!metadata && isLibraryMode) {
       // If the store hasn't finished hydrating the playlist array yet, wait for the DB call
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
    if (!cinemaVideo || !cinemaSub) return;
    onClose();
    startBackgroundCinemaSync(cinemaVideo, cinemaSub, cinemaEnSub || undefined);
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
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl border border-rose-100 overflow-hidden flex flex-col" >
            
            <div className="p-8 border-b border-rose-50 bg-rose-50/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl text-rose-400 shadow-sm border border-rose-50">
                  {isMountOnly ? <MonitorPlay className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-coquette-header text-gray-800 tracking-tight">
                    {isMountOnly ? 'MOUNT EPISODE binary' : (isCinema ? 'CINEMA SETUP' : 'MEDIA INGESTION')}
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 font-bold mt-1">
                    {isMountOnly ? `LINKING TO: ${selectedSeries?.title} - CH ${activeEpisodeNumber}` : (cinemaEnSub ? 'PARALLEL ALIGNMENT ACTIVE' : 'AI TRANSCRIPTION & TOKENIZATION')}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-rose-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
                <div className="flex flex-col gap-6">
                  {isMountOnly ? (
                    <div 
                      onClick={() => videoInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging('video'); }}
                      onDragLeave={() => setIsDragging(null)}
                      onDrop={handleDrop}
                      className={`relative min-h-[300px] rounded-[32px] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group ${isDragging ? 'bg-rose-50 border-rose-400 scale-[0.99]' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}
                    >
                       <input type="file" ref={videoInputRef} onChange={(e) => e.target.files && handleLibraryMount(e.target.files)} className="hidden" accept="video/*" />
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
                    <div className="grid grid-cols-3 gap-4">
                      <div onClick={() => videoInputRef.current?.click()} className={`h-[200px] rounded-[32px] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${cinemaVideo ? 'bg-emerald-50/30 border-emerald-200' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}>
                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => e.target.files && setCinemaVideoState(e.target.files[0])} />
                        {cinemaVideo ? <div className="text-center p-4"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-[10px] font-bold text-gray-600 truncate max-w-[100px]">{cinemaVideo.name}</p></div> : <div className="text-center px-4"><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-300"><FileVideoIcon className="w-5 h-5" /></div><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Video Source</h4></div>}
                      </div>
                      
                      <div onClick={() => subInputRef.current?.click()} className={`h-[200px] rounded-[32px] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${cinemaSub ? 'bg-emerald-50/30 border-emerald-200' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}>
                        <input type="file" ref={subInputRef} className="hidden" accept=".srt" onChange={(e) => e.target.files && setCinemaSub(e.target.files[0])} />
                        {cinemaSub ? <div className="text-center p-4"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-[10px] font-bold text-gray-600 truncate max-w-[100px]">{cinemaSub.name}</p></div> : <div className="text-center px-4"><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-300"><FileText className="w-5 h-5" /></div><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Japanese SRT</h4></div>}
                      </div>

                      <div onClick={() => enSubInputRef.current?.click()} className={`h-[200px] rounded-[32px] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${cinemaEnSub ? 'bg-emerald-50/30 border-emerald-200' : 'bg-gray-50/10 border-gray-100 hover:border-rose-100'}`}>
                        <input type="file" ref={enSubInputRef} className="hidden" accept=".srt" onChange={(e) => e.target.files && setCinemaEnSubState(e.target.files[0])} />
                        {cinemaEnSub ? <div className="text-center p-4"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-[10px] font-bold text-gray-600 truncate max-w-[100px]">{cinemaEnSub.name}</p></div> : <div className="text-center px-4"><div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-300"><Languages className="w-5 h-5" /></div><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">English Map (Opt)</h4></div>}
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => multiInputRef.current?.click()} className={`relative min-h-[300px] rounded-[32px] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group ${isDragging ? 'bg-rose-50 border-rose-400' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200'}`}>
                      <input type="file" ref={multiInputRef} onChange={(e) => e.target.files && handleStandardFilesSelect(e.target.files)} className="hidden" multiple accept="video/*" />
                      <div className="flex flex-col items-center flex-1 justify-center py-10">
                        <div className="p-5 rounded-full bg-white shadow-md text-rose-300 mb-6 border border-rose-50"><FileVideoIcon className="w-10 h-10" /></div>
                        <h3 className="text-xl font-bold font-coquette-header text-gray-700 tracking-wide uppercase tracking-[0.2em]">Drop Media</h3>
                      </div>
                    </div>
                  )}
                  {isCinema && !isMountOnly && <button disabled={!cinemaVideo || !cinemaSub} onClick={handleCinemaSubmit} className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${cinemaVideo && cinemaSub ? 'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'}`}><Zap className="w-5 h-5" /> Begin Cinematic Extraction</button>}
                </div>
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
