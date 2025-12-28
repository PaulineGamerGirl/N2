
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SubtitleOverlay from './SubtitleOverlay';
import ActionDock from './ActionDock';
import SyncManager from './SyncManager';
import { useImmersionStore } from '../../store/useImmersionStore';
import { useProgressStore } from '../../store/progressStore';
import { captureScreenshot, sliceAudio } from '../../services/miningService';
import { explainToken } from '../../services/immersionService';
import { dictionaryService } from '../../services/dictionaryService';
import { Play as PlayIcon, CheckCircle2, Heart, Check, X, Maximize2, Volume2, VolumeX, BrainCircuit, Sparkles, Quote, Loader2, Timer, TrendingUp, Info, Rewind, FastForward, RotateCcw, Pause } from 'lucide-react';
import { ImmersionToken, ExplanationCard } from '../../types/immersionSchema';
import FrequencyDock from './FrequencyDock';

interface AnimeStageProps {
  video: any;
  index: number;
  total: number;
}

const GestureFeedback: React.FC<{ type: 'play' | 'pause' | 'next' | 'prev' | 'restart', x: number, y: number }> = ({ type, x, y }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1.5 }}
      exit={{ opacity: 0, scale: 2 }}
      transition={{ duration: 0.5 }}
      className="absolute pointer-events-none z-[100] flex items-center justify-center"
      style={{ left: x - 40, top: y - 40, width: 80, height: 80 }}
    >
      <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 shadow-2xl">
        {type === 'play' && <PlayIcon className="w-10 h-10 text-white fill-white" />}
        {type === 'pause' && <Pause className="w-10 h-10 text-white fill-white" />}
        {type === 'next' && <FastForward className="w-10 h-10 text-white fill-white" />}
        {type === 'prev' && <Rewind className="w-10 h-10 text-white fill-white" />}
        {type === 'restart' && <RotateCcw className="w-10 h-10 text-white" />}
      </div>
    </motion.div>
  );
};

const OffsetToast: React.FC<{ offset: number; visible: boolean }> = ({ offset, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center gap-3 shadow-2xl"
      >
        <div className="p-1 rounded-full bg-rose-500/20">
          <Timer className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
          Sync Offset: <span className={offset === 0 ? 'text-white/40' : offset > 0 ? 'text-emerald-400' : 'text-rose-400'}>
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
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
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
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl border border-rose-100 overflow-hidden flex flex-col"
        >
          {isLoading && !explanation ? (
            <div className="p-20 flex flex-col items-center justify-center gap-6 text-center">
              <Loader2 className="w-12 h-12 text-rose-300 animate-spin" />
              <div>
                <p className="font-coquette-rounded text-2xl text-gray-700 font-bold tracking-tight">Consulting the Sensei</p>
                <p className="font-coquette-rounded text-rose-400 mt-2 font-medium">Deconstructing structure...</p>
              </div>
            </div>
          ) : explanation && (
            <>
              {/* Header */}
              <div className="p-8 bg-rose-50/30 border-b border-rose-100 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-white rounded-2xl text-rose-400 shadow-sm border border-rose-50">
                    <BrainCircuit className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-coquette-rounded text-2xl font-bold text-gray-800 leading-none">Breakdown Details</h3>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-rose-400 font-bold mt-2">
                        {isLoading ? 'Streaming Analysis...' : 'Morphological Deconstruction'}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-3 rounded-full hover:bg-white text-gray-400 hover:text-rose-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Breakdown List */}
              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar text-left bg-[#fffcfc]">
                {explanation.segments?.map((segment, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative p-6 rounded-3xl transition-all border ${segment.isTarget ? 'bg-emerald-50/40 border-emerald-100 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
                  >
                    {/* Header: Japanese + Romaji */}
                    <div className="flex items-baseline gap-4 mb-4 border-b border-gray-100 pb-3">
                      <span className={`text-2xl font-bold font-coquette-rounded tracking-wide ${segment.isTarget ? 'text-emerald-700' : 'text-gray-800'}`}>
                        {segment.japanese}
                      </span>
                      <span className="text-sm text-rose-400 font-coquette-rounded font-semibold tracking-wide">
                        {segment.romaji}
                      </span>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Meaning */}
                        <div className="md:col-span-1">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Meaning</span>
                            <span className="text-sm text-gray-700 font-medium font-coquette-body leading-relaxed">{segment.meaning || '---'}</span>
                        </div>
                        
                        {/* Analysis */}
                        <div className="md:col-span-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-black uppercase text-rose-300 tracking-widest block mb-1">Analysis</span>
                            <span className="text-sm text-gray-600 font-sans leading-relaxed">{segment.grammar_analysis || '---'}</span>
                        </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 text-rose-300 animate-spin" />
                    </div>
                )}
              </div>

              {/* Footer: Simple Sentence Explanation */}
              <div className="p-8 bg-rose-50/30 border-t border-rose-100">
                 <div className="flex items-center gap-2 mb-4">
                    <Quote className="w-5 h-5 text-rose-300" />
                    <span className="text-[11px] font-black uppercase text-rose-400 tracking-[0.3em]">Simple Sentence Explanation</span>
                 </div>
                 
                 <p className="text-xl md:text-2xl font-bold font-coquette-body text-gray-700 italic leading-relaxed">
                    "{explanation.naturalTranslation || '...'}"
                 </p>
              </div>

              <div className="p-6 bg-gray-50/80 border-t border-gray-100 text-center">
                 <button onClick={onClose} className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 hover:text-rose-400 transition-colors">
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
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false); 
  
  const [showOffsetToast, setShowOffsetToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gesture State
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gestureFeedback, setGestureFeedback] = useState<{ type: 'play' | 'pause' | 'next' | 'prev' | 'restart', x: number, y: number } | null>(null);

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
  const activeToken = useMemo(() => {
    if (!currentLine || activeGroupId === null) return null;
    return currentLine.japanese.find((t: any) => t.groupId === activeGroupId) || null;
  }, [currentLine, activeGroupId]);

  const seekToLine = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= dialogueData.length || !videoRef.current) return;
    const targetLine = dialogueData[targetIndex];
    videoRef.current.currentTime = targetLine.timestampStart;
    setCurrentTime(targetLine.timestampStart);
    videoRef.current.play().catch(() => {});
    setIsPaused(false);
    setActiveGroupId(null);
  }, [dialogueData]);

  const togglePlayback = useCallback((e?: React.MouseEvent) => {
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
  }, []);

  const handleNextLine = useCallback(() => {
    if (currentLineIndex !== -1) {
       seekToLine(currentLineIndex + 1);
    } else {
       const currentVideoTime = videoRef.current?.currentTime || 0;
       const nextIdx = dialogueData.findIndex(n => n.timestampStart > currentVideoTime);
       if (nextIdx !== -1) seekToLine(nextIdx);
    }
  }, [currentLineIndex, dialogueData, seekToLine]);

  const handlePrevLine = useCallback(() => {
    if (currentLineIndex !== -1) {
       seekToLine(currentLineIndex - 1);
    } else {
       const currentVideoTime = videoRef.current?.currentTime || 0;
       let prevIdx = -1;
       for (let i = dialogueData.length - 1; i >= 0; i--) {
           if (dialogueData[i].timestampStart < currentVideoTime) {
               prevIdx = i;
               break;
           }
       }
       if (prevIdx !== -1) seekToLine(prevIdx);
    }
  }, [currentLineIndex, dialogueData, seekToLine]);

  const handleRestartLine = useCallback(() => {
    if (currentLineIndex !== -1) {
       seekToLine(currentLineIndex);
    } else {
       handlePrevLine();
    }
  }, [currentLineIndex, seekToLine, handlePrevLine]);

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    let clientX, clientY;
    if ('changedTouches' in e) {
       clientX = e.changedTouches[0].clientX;
       clientY = e.changedTouches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    const width = window.innerWidth;
    const isRightSide = clientX > width / 2;

    if (now - lastTapRef.current < 300) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

    const performAction = () => {
        const count = tapCountRef.current;
        tapCountRef.current = 0;

        if (count === 1) {
            if (isMuted && videoRef.current) {
            }
            togglePlayback();
            setGestureFeedback({ type: videoRef.current?.paused ? 'play' : 'pause', x: clientX, y: clientY });
        } else if (count === 2) {
            if (isRightSide) {
                handleNextLine(); 
                setGestureFeedback({ type: 'next', x: clientX, y: clientY });
            } else {
                handleRestartLine();
                setGestureFeedback({ type: 'restart', x: clientX, y: clientY });
            }
        } else if (count === 3) {
             if (!isRightSide) {
                 handlePrevLine();
                 setGestureFeedback({ type: 'prev', x: clientX, y: clientY });
             } else {
                 handleNextLine();
                 setGestureFeedback({ type: 'next', x: clientX, y: clientY });
             }
        }
        setTimeout(() => setGestureFeedback(null), 600);
    };

    tapTimeoutRef.current = setTimeout(performAction, 300);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const handleTokenClick = (groupId: number) => {
    setActiveGroupId(groupId);
    videoRef.current?.pause();
    setIsPaused(true);
    setIsDictionaryOpen(false); 
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
    const groundTruthTranslation = currentLine.english.map((t: any) => t.text).join(' ');

    setIsExplaining(true);
    setExplanation(null);
    try {
      let localRank: number | null = null;
      if (targetWordToken) {
        const meta = await dictionaryService.getWordMeta(targetWordToken.baseForm || targetWordToken.text);
        localRank = meta ? meta.rank : null;
      }
      
      const data = await explainToken(
        fullSentence, 
        targetPhrase, 
        groundTruthTranslation, 
        localRank,
        (partialData) => setExplanation(partialData)
      );
      setExplanation(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsExplaining(false); 
    }
  };

  const handleMine = async () => {
    if (!videoRef.current || !currentLine || isMining) return;
    setIsMining(true);
    try {
      const screenshot = await captureScreenshot(videoRef.current);
      const audioUrl = await sliceAudio(videoRef.current, currentLine.timestampStart, currentLine.timestampEnd);
      const targetWordToken = currentLine.japanese.find((t: any) => t.groupId === activeGroupId);
      
      // Inject Source Episode if available
      const sourceEpisode = activeEpisodeNumber || undefined;

      addMinedCard({
        id: crypto.randomUUID(),
        sourceTitle: video.title,
        sourceEpisode: sourceEpisode, // New Field
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (showExitConfirm) return;

      switch(e.code) {
        case 'Space': e.preventDefault(); togglePlayback(); break;
        case 'ArrowRight': case 'KeyD': e.preventDefault(); handleNextLine(); break;
        case 'ArrowLeft': case 'KeyA':
          e.preventDefault();
          const currentVideoTime = videoRef.current?.currentTime || 0;
          if (currentLineIndex !== -1) {
             const activeLineStart = dialogueData[currentLineIndex].timestampStart;
             if (currentVideoTime - activeLineStart < 1.0) handlePrevLine();
             else handleRestartLine();
          } else {
             handlePrevLine();
          }
          break;
        case 'ArrowUp': case 'KeyW': e.preventDefault(); triggerOffsetChange(0.1); break;
        case 'ArrowDown': case 'KeyS': e.preventDefault(); triggerOffsetChange(-0.1); break;
        case 'KeyX': e.preventDefault(); handleMine(); break;
        case 'KeyC': e.preventDefault(); handleExplain(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLineIndex, dialogueData, isExplaining, isMining, subtitleOffset, isPaused, showExitConfirm, handleNextLine, handlePrevLine, handleRestartLine, togglePlayback]);

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
    <div className="h-[100dvh] w-screen bg-black relative overflow-hidden flex items-center justify-center">
      
      <div 
        className="absolute inset-0 z-30" 
        onTouchStart={handleTouch}
        onClick={(e) => { 
            if (!('ontouchstart' in window)) handleTouch(e); 
        }}
        style={{ touchAction: 'manipulation' }}
      />

      <video 
        ref={videoRef} 
        src={videoSrc} 
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} 
        className="w-full h-full object-contain pointer-events-none z-0" 
        loop 
        playsInline 
        muted={isMuted} 
        crossOrigin="anonymous" 
      />

      <AnimatePresence>
        {gestureFeedback && (
           <GestureFeedback type={gestureFeedback.type} x={gestureFeedback.x} y={gestureFeedback.y} />
        )}
      </AnimatePresence>

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
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-4xl z-[60] flex flex-col gap-3 pointer-events-none px-0"
          >
            <div className="flex items-center justify-between px-1 text-white/40 font-mono text-[10px] font-black tracking-[0.2em] uppercase">
               <span>{formatTime(currentTime)}</span>
               <span>{formatTime(duration)}</span>
            </div>
            <div className="relative group w-full h-10 flex items-center ui-interactable pointer-events-auto">
              <div className="absolute w-full h-1.5 bg-white/10 rounded-full" />
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                step="0.1" 
                value={currentTime} 
                onMouseDown={() => setIsScrubbing(true)} 
                onMouseUp={() => setIsScrubbing(false)} 
                onChange={handleSeek} 
                className="absolute w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-rose-500 group-hover:h-2.5 transition-all outline-none z-20" 
              />
              <div 
                className="h-1.5 bg-rose-500 rounded-full pointer-events-none transition-all group-hover:h-2.5 shadow-[0_0_15px_rgba(244,63,94,0.6)] z-10" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentLine && !showExitConfirm && (
           <motion.div 
             key={currentLine.id} 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }} 
             className="absolute bottom-52 left-0 right-0 z-40 pointer-events-none flex justify-center items-center"
           >
             <SubtitleOverlay line={currentLine} activeGroupId={activeGroupId} onTokenClick={handleTokenClick} isPaused={isPaused} />
           </motion.div>
        )}
      </AnimatePresence>

      <div className="ui-interactable relative z-[70]">
        <AnimatePresence>
          {isDictionaryOpen && activeToken && (
             <FrequencyDock targetToken={activeToken} episodeNodes={dialogueData} />
          )}
        </AnimatePresence>
        
        <ActionDock 
          isVisible={isPaused || activeGroupId !== null} 
          onMine={handleMine} 
          onExplain={handleExplain}
          isExplaining={isExplaining}
          onNextLine={handleNextLine} 
          onPrevLine={handlePrevLine} 
          isFirst={currentLineIndex <= 0} 
          isLast={currentLineIndex >= dialogueData.length - 1} 
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)} 
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isDictionaryOpen={isDictionaryOpen}
          onToggleDictionary={() => setIsDictionaryOpen(!isDictionaryOpen)}
        />
      </div>

      <SyncManagerWrapper isOpen={isSettingsOpen} />
      <ExitConfirmation isOpen={showExitConfirm} onConfirm={confirmExit} onCancel={() => setShowExitConfirm(false)} />
      <SenseiModal explanation={explanation} isLoading={isExplaining} onClose={() => setExplanation(null)} />
      
      <AnimatePresence>
        {isMining && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[500] flex flex-col items-center justify-center gap-8">
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
      <motion.div 
        initial={{ x: 300, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        exit={{ x: 300, opacity: 0 }} 
        className="fixed top-24 right-10 z-[150] w-80 pointer-events-auto ui-interactable" 
        onClick={(e) => e.stopPropagation()}
      >
         <SyncManager />
      </motion.div>
    )}
  </AnimatePresence>
);

export default AnimeStage;
