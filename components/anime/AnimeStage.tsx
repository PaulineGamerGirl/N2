
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SubtitleOverlay from './SubtitleOverlay';
import ActionDock from './ActionDock';
import SyncManager from './SyncManager';
import { useImmersionStore } from '../../store/useImmersionStore';
import { useProgressStore } from '../../store/progressStore';
import { captureScreenshot, sliceAudio } from '../../services/miningService';
import { explainToken } from '../../services/immersionService';
import { Play as PlayIcon, CheckCircle2, Heart, Check, X, Maximize2, Volume2, VolumeX, BrainCircuit, Sparkles, Quote, Loader2, Timer } from 'lucide-react';
import { ImmersionToken, ExplanationCard } from '../../types/immersionSchema';

interface AnimeStageProps {
  video: any;
  index: number;
  total: number;
}

const OffsetToast: React.FC<{ offset: number; visible: boolean }> = ({ offset, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center gap-3 shadow-2xl"
      >
        <Timer className="w-4 h-4 text-rose-400" />
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
          Offset: <span className={offset === 0 ? 'text-white/40' : offset > 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {offset > 0 ? '+' : ''}{offset.toFixed(1)}s
          </span>
        </span>
      </motion.div>
    )}
  </AnimatePresence>
);

const ExitConfirmation: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-[#fffcfc] rounded-[40px] shadow-2xl p-10 text-center border border-rose-100"
      >
        <div className="p-4 rounded-full bg-rose-50 text-rose-400 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h3 className="text-2xl font-bold font-coquette-header text-gray-800 mb-3">Record Progress?</h3>
        <p className="text-sm text-gray-500 font-coquette-body italic mb-8 leading-relaxed">
          "Shall we finalize this chapter in the Chronicle?"
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-4 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest text-xs shadow-lg hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Save and Exit
          </button>
          <button onClick={onCancel} className="w-full py-4 rounded-2xl bg-gray-50 text-gray-400 font-bold text-xs hover:bg-gray-100 transition-all uppercase tracking-widest">
            Back to Immersion
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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
                    <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 font-bold mt-2">Grammatical Decomposition</p>
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
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Morphology breakdown</span>
                   </div>
                   <p className="text-sm font-bold text-gray-700 mb-3">Base Pattern: <span className="text-rose-400">{explanation.analysis.baseForm}</span></p>
                   <div className="flex flex-wrap gap-2 mb-4">
                      {explanation.analysis.conjugationPath.map((step, i) => (
                        <span key={i} className="text-[10px] px-3 py-1 bg-white border border-rose-50 rounded-full text-rose-400 font-bold shadow-sm">
                           {step}
                        </span>
                      ))}
                   </div>
                   <p className="text-xs leading-relaxed text-gray-500 italic font-coquette-body">"{explanation.analysis.breakdown}"</p>
                </div>

                <div className="pt-2">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Context Nuance</span>
                      <span className="text-[10px] font-black text-white bg-coquette-accent px-3 py-1 rounded-full">{explanation.nuance.jlptLevel}</span>
                   </div>
                   <p className="text-base leading-relaxed text-gray-600 font-coquette-body">
                      {explanation.nuance.explanation}
                   </p>
                </div>

                <div className="pt-6 border-t border-rose-50">
                   <div className="flex items-center gap-2 mb-3">
                      <Quote className="w-4 h-4 text-rose-200" />
                      <span className="text-[10px] font-black uppercase text-rose-300 tracking-widest">Natural Vibe</span>
                   </div>
                   <p className="text-lg font-bold font-coquette-body text-gray-800 italic leading-relaxed">
                      "{explanation.naturalTranslation}"
                   </p>
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 border-t border-rose-50 text-center">
                 <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-rose-400 transition-colors">
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

const AnimeStage: React.FC<AnimeStageProps> = ({ video, index, total }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationCard | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [showOffsetToast, setShowOffsetToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { 
    videoSources, 
    getSyncedNodes, 
    addMinedCard, 
    setViewMode, 
    clearPlaylist, 
    activeSeriesId, 
    activeEpisodeNumber,
    subtitleOffset,
    setSubtitleOffset
  } = useImmersionStore();
  
  const { startImmersionSession, endImmersionSession } = useProgressStore();

  if (!video) return null;
  const videoSrc = videoSources[video.videoId || video.id] || video.videoUrl;
  const dialogueData = useMemo(() => getSyncedNodes(), [video.nodes, video.dialogue, subtitleOffset]);

  useEffect(() => {
    if (!showExitConfirm) startImmersionSession();
  }, []);

  const currentLineIndex = useMemo(() => {
    const syncTime = currentTime + 0.2;
    return dialogueData.findIndex((node: any) => 
      syncTime >= node.timestampStart && syncTime <= node.timestampEnd
    );
  }, [currentTime, dialogueData]);

  const currentLine = dialogueData[currentLineIndex];

  const seekToLine = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= dialogueData.length || !videoRef.current) return;
    const targetLine = dialogueData[targetIndex];
    videoRef.current.currentTime = targetLine.timestampStart;
    setCurrentTime(targetLine.timestampStart);
    videoRef.current.play().catch(() => {});
    setIsPaused(false);
    setActiveGroupId(null);
  };

  const togglePlayback = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPaused(false);
      setActiveGroupId(null);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.ui-interactable')) return;
    if (isSettingsOpen) { setIsSettingsOpen(false); return; }
    if (activeGroupId !== null) {
      setActiveGroupId(null);
      videoRef.current?.play();
      setIsPaused(false);
      return;
    }
    togglePlayback();
  };

  const handleTokenClick = (groupId: number) => {
    setActiveGroupId(groupId);
    videoRef.current?.pause();
    setIsPaused(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) setCurrentTime(videoRef.current.currentTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0) {
        setIsMuted(false);
        videoRef.current.muted = false;
      } else {
        setIsMuted(true);
        videoRef.current.muted = true;
      }
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
      if (!nextMute && volume === 0) handleVolumeChange(0.5);
    }
  };

  const handleExplain = async () => {
    if (!currentLine || isExplaining) return;
    const fullSentence = currentLine.japanese.map((t: any) => t.text).join('');
    const targetWordToken = currentLine.japanese.find((t: any) => t.groupId === activeGroupId);
    const targetPhrase = targetWordToken?.text || fullSentence;

    setIsExplaining(true);
    try {
      const data = await explainToken(fullSentence, targetPhrase);
      setExplanation(data);
    } catch (e) { console.error(e); } finally { setIsExplaining(false); }
  };

  const handleMine = async () => {
    if (!videoRef.current || !currentLine || isMining) return;
    setIsMining(true);
    try {
      const screenshot = await captureScreenshot(videoRef.current);
      const audioUrl = await sliceAudio(videoRef.current, currentLine.timestampStart, currentLine.timestampEnd);
      const targetWordToken = currentLine.japanese.find((t: any) => t.groupId === activeGroupId);
      addMinedCard({
        id: crypto.randomUUID(),
        sourceTitle: video.title,
        front: targetWordToken?.text || 'Fragment',
        back: currentLine.japanese.map((t: any) => t.text).join(''),
        translation: currentLine.english.filter((t: any) => t.groupId === activeGroupId).map((t: any) => t.text).join(' ') || 'Translation',
        fullTranslation: currentLine.english.map((t: any) => t.text).join(' '),
        image: screenshot,
        audio: audioUrl,
        timestamp: Date.now()
      });
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } catch (e) { console.error(e); } finally { setIsMining(false); }
  };

  const triggerOffsetChange = (amt: number) => {
    setSubtitleOffset(parseFloat((subtitleOffset + amt).toFixed(1)));
    setShowOffsetToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setShowOffsetToast(false), 1500);
  };

  // --- KEYBOARD HOTKEYS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (showExitConfirm) return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          seekToLine(currentLineIndex + 1);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          if (videoRef.current && currentLine) {
            const timeInLine = videoRef.current.currentTime - currentLine.timestampStart;
            if (timeInLine < 0.5) seekToLine(currentLineIndex - 1);
            else seekToLine(currentLineIndex);
          }
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          triggerOffsetChange(0.1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          triggerOffsetChange(-0.1);
          break;
        case 'KeyX':
          e.preventDefault();
          handleMine();
          break;
        case 'KeyC':
          e.preventDefault();
          handleExplain();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLineIndex, currentLine, isExplaining, isMining, subtitleOffset]);

  const confirmExit = () => {
    const summary = activeSeriesId 
      ? `Immersed in ${video.title} (Ep ${activeEpisodeNumber})`
      : `Immersed in ${video.title}`;
    endImmersionSession(summary);
    clearPlaylist();
    setViewMode('standard');
    setShowExitConfirm(false);
  };

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center" onClick={handleBackgroundClick}>
      <video 
        ref={videoRef} 
        src={videoSrc} 
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} 
        className="w-full h-full object-contain pointer-events-none" 
        loop 
        playsInline 
        muted={isMuted} 
        crossOrigin="anonymous" 
      />

      <OffsetToast offset={subtitleOffset} visible={showOffsetToast} />

      <div className="absolute top-8 left-10 z-50 flex items-center gap-6 pointer-events-none">
        <button onClick={() => setShowExitConfirm(true)} className="p-3 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all pointer-events-auto ui-interactable">
           <X className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {(isPaused || activeGroupId !== null) && !isMining && !showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 30 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[800px] max-w-[90vw] z-40 flex flex-col gap-3 pointer-events-none"
          >
            <div className="flex items-center justify-between px-2 text-white/50 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
               <span>{formatTime(currentTime)}</span>
               <span>{formatTime(duration)}</span>
            </div>
            <div className="relative group w-full h-12 flex items-center ui-interactable pointer-events-auto">
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                step="0.1" 
                value={currentTime} 
                onMouseDown={() => setIsScrubbing(true)} 
                onMouseUp={() => setIsScrubbing(false)} 
                onChange={handleSeek} 
                className="absolute w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-rose-500 hover:h-2 transition-all outline-none" 
              />
              <div className="h-1 bg-rose-500 rounded-full pointer-events-none transition-all group-hover:h-2" style={{ width: `${(currentTime / duration) * 100}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentLine && !showExitConfirm && (
           <motion.div key={currentLine.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-32 left-0 right-0 z-10 pointer-events-none">
             <SubtitleOverlay line={currentLine} activeGroupId={activeGroupId} onTokenClick={handleTokenClick} />
           </motion.div>
        )}
      </AnimatePresence>

      <div className="ui-interactable">
        <ActionDock 
          isVisible={activeGroupId !== null} 
          onMine={handleMine} 
          onExplain={handleExplain}
          isExplaining={isExplaining}
          onNextLine={() => seekToLine(currentLineIndex + 1)} 
          onPrevLine={() => seekToLine(currentLineIndex - 1)} 
          isFirst={currentLineIndex <= 0} 
          isLast={currentLineIndex >= dialogueData.length - 1} 
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)} 
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      </div>

      <SyncManagerWrapper isOpen={isSettingsOpen} />
      <ExitConfirmation isOpen={showExitConfirm} onConfirm={confirmExit} onCancel={() => setShowExitConfirm(false)} />
      <SenseiModal explanation={explanation} isLoading={isExplaining} onClose={() => setExplanation(null)} />
      
      <AnimatePresence>
        {isMining && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center gap-8">
             <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
             <p className="text-emerald-400 font-black uppercase tracking-[0.5em] text-xs animate-pulse">Extracting Lexical Data</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SyncManagerWrapper: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="absolute top-24 right-10 z-40 w-80 pointer-events-auto ui-interactable" onClick={(e) => e.stopPropagation()}>
         <SyncManager />
      </motion.div>
    )}
  </AnimatePresence>
);

export default AnimeStage;
