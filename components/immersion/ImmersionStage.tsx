
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImmersionVideo } from '../../types';
import TranscriptStream from './TranscriptStream';
import { 
  Clapperboard, 
  Plus, 
  VolumeX,
  Play as PlayIcon,
  Sparkles,
  Eye,
  EyeOff,
  BrainCircuit,
  X,
  Quote,
  Loader2,
  Music,
  RotateCcw,
  Check,
  Heart
} from 'lucide-react';
import { useImmersionStore } from '../../store/useImmersionStore';
import { useProgressStore } from '../../store/progressStore';
import UploadGateway from './UploadGateway';
import { explainToken } from '../../services/immersionService';
import { ExplanationCard } from '../../types/immersionSchema';

interface ImmersionStageProps {
  video: ImmersionVideo | any;
  isActive: boolean;
  index: number;
  total: number;
}

const ExitConfirmation: React.FC<{
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-950/40 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-10 text-center border border-rose-100"
      >
        <div className="p-4 rounded-full bg-rose-50 text-rose-400 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h3 className="text-2xl font-bold font-coquette-header text-gray-800 mb-3">Done Immersing, Pauline?</h3>
        <p className="text-sm text-gray-500 font-coquette-body italic mb-8 leading-relaxed">
          "Shall we record this chapter of your journey in the Chronicle?"
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-4 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest text-xs shadow-lg hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Yes, record progress
          </button>
          <button onClick={onCancel} className="w-full py-4 rounded-2xl bg-gray-50 text-gray-400 font-bold text-xs hover:bg-gray-100 transition-all uppercase tracking-widest">
            No, keep watching
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SenseiModal: React.FC<{ 
  explanation: ExplanationCard | null; 
  isLoading: boolean;
  onClose: () => void 
}> = ({ explanation, isLoading, onClose }) => {
  if (!explanation && !isLoading) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-rose-950/20 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-rose-100 overflow-hidden flex flex-col"
        >
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-6 text-center">
              <Loader2 className="w-10 h-10 text-rose-300 animate-spin" />
              <div>
                <p className="font-coquette-header text-xl text-gray-700 font-bold">Consulting the Sensei</p>
                <p className="font-coquette-body italic text-rose-400 mt-1">Deep analysis in progress...</p>
              </div>
            </div>
          ) : explanation && (
            <>
              <div className="p-8 bg-rose-50/30 border-b border-rose-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-rose-400 shadow-sm">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-coquette-header text-xl font-bold text-gray-800 leading-none">Sensei's Insight</h3>
                    <p className="text-10px uppercase tracking-0.2em text-rose-400 font-bold mt-2">Grammatical Decomposition</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-rose-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div>
                   <h2 className="text-4xl font-bold font-coquette-header text-coquette-text">{explanation.headword.text}</h2>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-black text-rose-300 uppercase tracking-widest">{explanation.headword.romaji}</span>
                      <span className="w-1 h-1 rounded-full bg-rose-200"></span>
                      <span className="text-base font-medium text-gray-500 font-coquette-body italic">{explanation.headword.basicMeaning}</span>
                   </div>
                </div>

                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100">
                   <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-3.5 h-3.5 text-coquette-gold" />
                      <span className="text-10px font-black uppercase text-gray-400 tracking-0.2em">Morphology breakdown</span>
                   </div>
                   <p className="text-sm font-bold text-gray-700 mb-3">Base Pattern: <span className="text-rose-400">{explanation.analysis.baseForm}</span></p>
                   <div className="flex flex-wrap gap-2 mb-4">
                      {explanation.analysis.conjugationPath.map((step, i) => (
                        <span key={i} className="text-10px px-3 py-1 bg-white border border-rose-50 rounded-full text-rose-400 font-bold shadow-sm">
                           {step}
                        </span>
                      ))}
                   </div>
                   <p className="text-xs leading-relaxed text-gray-500 italic font-coquette-body">"{explanation.analysis.breakdown}"</p>
                </div>

                <div className="pt-2">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-10px font-black uppercase text-gray-400 tracking-0.2em">Context Nuance</span>
                      <span className="text-10px font-black text-white bg-coquette-accent px-3 py-1 rounded-full">{explanation.nuance.jlptLevel}</span>
                   </div>
                   <p className="text-base leading-relaxed text-gray-600 font-coquette-body">
                      {explanation.nuance.explanation}
                   </p>
                </div>

                <div className="pt-6 border-t border-rose-50">
                   <div className="flex items-center gap-2 mb-3">
                      <Quote className="w-4 h-4 text-rose-200" />
                      <span className="text-10px font-black uppercase text-rose-300 tracking-widest">Natural Vibe</span>
                   </div>
                   <p className="text-lg font-bold font-coquette-body text-gray-800 italic leading-relaxed">
                      "{explanation.naturalTranslation}"
                   </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 border-t border-rose-50 text-center">
                 <button onClick={onClose} className="text-10px font-black uppercase tracking-0.4em text-gray-400 hover:text-rose-400 transition-colors">
                    Close Analysis
                 </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ImmersionStage: React.FC<ImmersionStageProps> = ({ video, isActive, index, total }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranslationVisible, setIsTranslationVisible] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // --- PLAYER ENHANCEMENT STATE ---
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationCard | null>(null);

  const { videoSources, layoutMode, clearPlaylist, activeSeriesId, activeEpisodeNumber } = useImmersionStore();
  const { startImmersionSession, endImmersionSession } = useProgressStore();
  
  if (!video) return null;

  const videoSrc = videoSources[video.videoId || video.id] || video.videoUrl;
  const dialogueData = video.nodes || video.dialogue || [];

  useEffect(() => {
    if (isActive && !showExitConfirm) {
      startImmersionSession();
    }
  }, [isActive]);

  const handleExit = () => {
    if (videoRef.current) videoRef.current.pause();
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    const summary = activeSeriesId 
      ? `Immersed in ${video.title || 'Series'} (Episode ${activeEpisodeNumber})`
      : `Immersed in ${video.title || 'Untitled Session'}`;
      
    endImmersionSession(summary);
    clearPlaylist();
    setShowExitConfirm(false);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    
    if (!isScrubbing) {
      setCurrentTime(time);
    }

    const syncTime = time + 0.2; 
    
    const currentLine = dialogueData.find((node: any) => 
      syncTime >= node.timestampStart && syncTime <= node.timestampEnd
    );

    if (currentLine && currentLine.id !== activeNodeId) {
      setActiveNodeId(currentLine.id);
      setIsTranslationVisible(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSeekManual = (timestamp: number) => {
    if (!videoRef.current) return;
    const player = videoRef.current;
    player.pause();
    player.currentTime = timestamp;
    
    const onSeeked = () => {
        player.play().catch(() => {});
        setIsPaused(false);
        player.removeEventListener('seeked', onSeeked);
    };

    player.addEventListener('seeked', onSeeked);
  };

  const handleExplainContext = async () => {
    const activeNode = dialogueData.find((node: any) => node.id === activeNodeId);
    if (!activeNode) return;

    const fullSentence = activeNode.japanese.map((t: any) => t.text).join('');
    setIsExplaining(true);
    try {
      const data = await explainToken(fullSentence, fullSentence);
      setExplanation(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && !showExitConfirm) {
        videoRef.current.play().catch(() => {});
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isActive, showExitConfirm]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isYouTubeMode = layoutMode === 'stacked';

  return (
    <div className="h-screen w-full snap-start flex flex-col bg-[#fffcfc]">
      <header className="h-[60px] w-full border-b border-rose-100 bg-white px-8 flex items-center justify-between shrink-0 z-[60]">
         <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-rose-50 text-coquette-accent">
               <Clapperboard className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-base font-coquette-header text-coquette-text leading-none tracking-tight">Immersion Theater</h1>
               <span className="text-8px font-black text-rose-300 uppercase tracking-0.2em mt-0.5">
                  {isYouTubeMode ? 'YouTube Mode' : 'TikTok Mode'}
               </span>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button 
              onClick={handleExit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-400 hover:bg-rose-100 transition-all shadow-sm group"
              title="Close Session"
            >
               <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
               <span className="text-10px font-bold uppercase tracking-widest hidden sm:inline">Finish</span>
            </button>
            <button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-100 text-rose-400 hover:bg-rose-50 transition-all shadow-sm group">
               <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
               <span className="text-10px font-bold uppercase tracking-widest">Ingest Media</span>
            </button>
            <div className="h-8 w-px bg-rose-50" />
            <div className="flex flex-col items-end min-w-[60px]">
               <span className="text-8px font-black text-coquette-subtext uppercase tracking-widest">Scene</span>
               <span className="text-10px font-bold text-coquette-text">{index + 1} of {total}</span>
            </div>
         </div>
      </header>

      <div className={`flex-1 flex overflow-hidden ${isYouTubeMode ? 'flex-col' : 'flex-row'}`}>
        <div className={`
          flex flex-col transition-all duration-500 overflow-y-auto custom-scrollbar bg-black/5
          ${isYouTubeMode ? 'w-full h-[65%] items-center p-6' : 'w-auto max-w-[50%] h-full items-center justify-center p-8'}
        `}>
          <div className={`
            relative rounded-[32px] overflow-hidden shadow-2xl border border-rose-100 bg-black group
            ${isYouTubeMode ? 'w-full max-w-5xl aspect-video' : 'h-full max-h-[80vh] aspect-[9/16]'}
          `}>
            <video
              ref={videoRef}
              src={videoSrc}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              loop
              muted={isMuted}
              playsInline
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
              crossOrigin="anonymous"
            />
            
            <AnimatePresence>
              {isPaused && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
                >
                  <PlayIcon className="w-16 h-16 text-white/90 drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PLAYER CONTROLS CONTAINER */}
          <div className={`
            mt-6 w-full flex flex-col gap-4 items-center justify-center transition-all duration-500
            ${isYouTubeMode ? 'max-w-xl' : 'max-w-xs'}
          `}>
            {/* SCRUBBER SECTION */}
            <div className="w-full flex flex-col gap-1 px-4">
               <div className="flex justify-between text-9px font-black text-rose-300 uppercase tracking-widest px-1 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
               </div>
               <div className="relative h-6 flex items-center group cursor-pointer">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onMouseDown={() => setIsScrubbing(true)}
                    onMouseUp={() => setIsScrubbing(false)}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-rose-100 rounded-full appearance-none cursor-pointer accent-rose-400 group-hover:h-2 transition-all outline-none"
                  />
               </div>
            </div>

            {/* ACTION BUTTONS BAR */}
            <div className="w-full flex items-center justify-between px-6 py-3 rounded-[40px] bg-white border border-rose-100 shadow-[0_15px_40px_rgba(244,172,183,0.15)] relative">
               <button 
                  onClick={() => { setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted; }}
                  className={`
                    relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden
                    ${isMuted ? 'bg-gray-100 text-gray-300' : 'bg-rose-50 text-rose-400 shadow-inner'}
                  `}
                  title={isMuted ? "Unmute" : "Mute"}
               >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isMuted ? 'muted' : 'unmuted'}
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                    </motion.div>
                  </AnimatePresence>
                  {!isMuted && (
                    <motion.div 
                      animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-rose-200 rounded-full"
                    />
                  )}
               </button>

               <button 
                  onClick={handleExplainContext}
                  disabled={!activeNodeId || isExplaining}
                  className={`
                    flex items-center gap-2.5 px-6 py-2.5 rounded-full font-bold transition-all shadow-md active:scale-95
                    ${!activeNodeId ? 'bg-gray-100 text-gray-300' : 'bg-coquette-accent text-white hover:bg-[#ff9eb0] shadow-rose-100'}
                  `}
               >
                  {isExplaining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span className="uppercase font-black text-9px tracking-widest whitespace-nowrap">Sensei Insight</span>
               </button>

               <button 
                  onClick={() => setIsTranslationVisible(!isTranslationVisible)}
                  disabled={!activeNodeId}
                  className={`p-2.5 rounded-full transition-all ${isTranslationVisible ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-rose-400'} disabled:opacity-30`}
               >
                  {isTranslationVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>
            </div>
          </div>
        </div>

        <div className={`
          flex-1 h-full bg-[#fffcfc]/40 backdrop-blur-sm shadow-inner transition-all duration-500
          ${isYouTubeMode ? 'border-t' : 'border-l'} border-rose-100
        `}>
           <TranscriptStream 
              nodes={dialogueData} 
              activeNodeId={activeNodeId}
              onSeek={handleSeekManual}
              isTranslationVisible={isTranslationVisible}
           />
        </div>
      </div>

      <UploadGateway isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <SenseiModal explanation={explanation} isLoading={isExplaining} onClose={() => setExplanation(null)} />
      <ExitConfirmation isOpen={showExitConfirm} title={video.title} onConfirm={confirmExit} onCancel={() => setShowExitConfirm(false)} />
    </div>
  );
};

export default ImmersionStage;
