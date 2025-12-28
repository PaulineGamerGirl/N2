
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
import { Play as PlayIcon, Heart, Check, X, BrainCircuit, Sparkles, Quote, Loader2, Timer, TrendingUp, Network, Pause, BookOpen, ChevronRight, History } from 'lucide-react';
import { ExplanationCard } from '../../types/immersionSchema';
import FrequencyDock from './FrequencyDock';

interface AnimeStageProps {
  video: any;
  index: number;
  total: number;
}

const LoadingWave: React.FC = () => (
  <div className="flex items-center justify-center gap-2 h-16">
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <motion.div
        key={i}
        animate={{ 
          height: [16, 64, 16],
          backgroundColor: ["#fecdd3", "#f43f5e", "#fecdd3"]
        }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          delay: i * 0.15,
          ease: "easeInOut" 
        }}
        className="w-2 rounded-full"
      />
    ))}
  </div>
);

const SenseiModal: React.FC<{ 
  explanation: ExplanationCard | null; 
  isLoading: boolean;
  onClose: () => void 
}> = ({ explanation, isLoading, onClose }) => {
  if (!explanation && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 md:p-8 pointer-events-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
      
      {isLoading && !explanation ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 flex flex-col items-center justify-center gap-12 text-center"
        >
          <LoadingWave />
          <div className="space-y-4">
            <h3 className="font-coquette-header text-5xl text-white italic font-bold tracking-tight">Sensei is deconstructing the manuscript...</h3>
            <p className="text-sm uppercase tracking-[0.6em] text-rose-400 font-black animate-pulse">Linguistic Pattern Detection Active</p>
          </div>
        </motion.div>
      ) : explanation && (
        <motion.div 
          initial={{ scale: 0.98, opacity: 0, y: 15 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.98, opacity: 0, y: 15 }}
          className="relative w-full max-w-6xl bg-[#fffcfc] rounded-[40px] shadow-[0_40px_120px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[92vh] border border-rose-100/10"
        >
          <div className="px-10 py-6 border-b border-rose-100/50 flex justify-between items-center bg-white/40 shrink-0">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-400 shadow-sm border border-rose-100">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-coquette-header text-3xl font-bold text-gray-800 italic">Linguistic Manuscript</h3>
                <p className="text-[9px] uppercase tracking-[0.4em] text-rose-400 font-black mt-1">Precise Morphological Analysis</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-rose-50 text-gray-300 hover:text-rose-400 transition-all">
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
            <div className="space-y-4">
              {explanation.segments?.map((segment, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex flex-col lg:flex-row gap-6 p-6 rounded-[28px] border transition-all ${segment.isTarget ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-rose-50/50'}`}
                >
                  <div className="lg:w-1/3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Phrase {index + 1}</span>
                      {segment.jlptLevel && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[9px] font-black tracking-widest shadow-sm">
                          {segment.jlptLevel}
                        </span>
                      )}
                    </div>
                    <h4 className="text-3xl font-bold font-coquette-header text-gray-800 leading-tight">
                      {segment.japanese}
                    </h4>
                    <p className="text-lg font-coquette-body text-rose-400 italic mt-2 leading-relaxed">
                      {segment.meaning}
                    </p>
                  </div>

                  <div className="lg:w-2/3 bg-white/60 rounded-2xl p-5 border border-rose-100/30 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <BookOpen className="w-3 h-3" /> The Grammar Chain
                    </div>
                    <div className="text-sm text-gray-600 font-coquette-rounded leading-relaxed whitespace-pre-wrap prose prose-sm prose-rose max-w-none">
                      {segment.grammar_analysis}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative p-8 rounded-[32px] bg-white border border-rose-100 shadow-lg overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-400" />
                <div className="flex items-center gap-2.5 mb-4">
                  <Quote className="w-5 h-5 text-rose-200" />
                  <span className="text-[10px] font-black uppercase text-rose-300 tracking-[0.4em]">Simple Explanation</span>
                </div>
                <p className="text-2xl md:text-3xl font-bold font-coquette-body text-gray-800 italic leading-snug">
                  "{explanation.naturalTranslation}"
                </p>
              </div>

              <div className="p-8 rounded-[32px] bg-rose-900/5 border border-rose-100/50 flex gap-6 items-start">
                 <Network className="w-6 h-6 text-rose-300 shrink-0 mt-1" />
                 <div>
                    <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-400 mb-2">Sentence Visual Logic</h5>
                    <p className="text-base font-coquette-body text-rose-900/60 leading-relaxed italic">
                       {explanation.visualLogic}
                    </p>
                 </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50/80 border-t border-rose-100/50 text-center shrink-0">
             <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 hover:text-rose-400 transition-all">
                Dismiss Manuscript
             </button>
          </div>
        </motion.div>
      )}
    </div>
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
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false); 
  const [showOffsetIndicator, setShowOffsetIndicator] = useState(false);
  const lastTapRef = useRef<number>(0);

  const { videoSources, getSyncedNodes, addMinedCard, setViewMode, clearPlaylist, subtitleOffset, setSubtitleOffset } = useImmersionStore();
  const { startImmersionSession } = useProgressStore();

  if (!video) return null;
  const videoSrc = videoSources[video.videoId || video.id] || video.videoUrl;
  const dialogueData = useMemo(() => getSyncedNodes(), [video.nodes, video.dialogue, subtitleOffset]);

  useEffect(() => { startImmersionSession(); }, []);

  const currentLineIndex = useMemo(() => {
    const syncTime = currentTime + 0.2;
    return dialogueData.findIndex((node: any) => syncTime >= node.timestampStart && syncTime <= node.timestampEnd);
  }, [currentTime, dialogueData]);

  const currentLine = dialogueData[currentLineIndex];
  const activeToken = useMemo(() => {
    if (!currentLine || activeGroupId === null) return null;
    return currentLine.japanese.find((t: any) => t.groupId === activeGroupId) || null;
  }, [currentLine, activeGroupId]);

  const togglePlayback = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPaused(false); setActiveGroupId(null); }
    else { videoRef.current.pause(); setIsPaused(true); }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const targetTime = pct * duration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  /**
   * Chronological Navigation Handler
   * Scans for the closest segment start point to avoid index mismatches and resets.
   */
  const jumpToLineRelative = useCallback((direction: 'next' | 'prev') => {
    if (!videoRef.current || dialogueData.length === 0) return;
    
    let targetIdx = -1;
    if (direction === 'next') {
      // Find the first line that starts AFTER current time
      targetIdx = dialogueData.findIndex(n => n.timestampStart > currentTime + 0.3);
    } else {
      // Find the last line that starts BEFORE current time
      const candidates = [...dialogueData].reverse();
      const reversedIdx = candidates.findIndex(n => n.timestampStart < currentTime - 1.0);
      if (reversedIdx !== -1) targetIdx = dialogueData.length - 1 - reversedIdx;
    }

    if (targetIdx !== -1) {
      const targetTime = dialogueData[targetIdx].timestampStart;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      if (videoRef.current.paused) { videoRef.current.play(); setIsPaused(false); }
      setActiveGroupId(null);
    }
  }, [dialogueData, currentTime]);

  const handleExplain = async () => {
    if (!currentLine || isExplaining) return;
    const fullSentence = currentLine.japanese.map((t: any) => t.text).join('');
    const groundTruthTranslation = currentLine.english.map((t: any) => t.text).join(' ');
    setIsExplaining(true); setExplanation(null);
    try {
      const data = await explainToken(fullSentence, fullSentence, groundTruthTranslation, null, (partial) => setExplanation(partial));
      setExplanation(data);
    } catch (e) { console.error(e); } finally { setIsExplaining(false); }
  };

  const handleMine = async () => {
    if (!videoRef.current || !currentLine || isMining) return;
    setIsMining(true);
    try {
      const screenshot = await captureScreenshot(videoRef.current);
      const audioUrl = await sliceAudio(videoRef.current, currentLine.timestampStart, currentLine.timestampEnd);
      addMinedCard({ id: crypto.randomUUID(), sourceTitle: video.title, front: activeToken?.text || 'Fragment', back: currentLine.japanese.map((t: any) => t.text).join(''), translation: currentLine.english.filter((t: any) => t.groupId === activeGroupId).map((t: any) => t.text).join(' ') || 'Translation', fullTranslation: currentLine.english.map((t: any) => t.text).join(' '), image: screenshot, audio: audioUrl, timestamp: Date.now() });
    } finally { setIsMining(false); }
  };

  const adjustOffset = useCallback((delta: number) => {
    setSubtitleOffset(parseFloat((subtitleOffset + delta).toFixed(1)));
    setShowOffsetIndicator(true);
    setTimeout(() => setShowOffsetIndicator(false), 800);
  }, [subtitleOffset, setSubtitleOffset]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayback(); break;
        case 'KeyA': case 'ArrowLeft': jumpToLineRelative('prev'); break;
        case 'KeyD': case 'ArrowRight': jumpToLineRelative('next'); break;
        case 'KeyW': case 'ArrowUp': e.preventDefault(); adjustOffset(0.1); break;
        case 'KeyS': case 'ArrowDown': e.preventDefault(); adjustOffset(-0.1); break;
        case 'KeyE': handleExplain(); break;
        case 'KeyR': handleMine(); break;
        case 'KeyM': setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted; break;
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [togglePlayback, jumpToLineRelative, adjustOffset, isMuted, handleExplain, handleMine]);

  // --- TOUCH GESTURES (IPAD) ---
  const handleTouch = (e: React.TouchEvent) => {
    const now = Date.now();
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;
    
    if (now - lastTapRef.current < 300) {
      if (touchX > screenWidth * 0.7) jumpToLineRelative('next');
      else if (touchX < screenWidth * 0.3) jumpToLineRelative('prev');
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isModalOpen = !!explanation || isExplaining;
  const showUI = (isPaused || activeGroupId !== null) && !isMining && !isModalOpen;

  return (
    <div className="h-[100dvh] w-screen bg-black relative overflow-hidden flex items-center justify-center" onTouchStart={handleTouch}>
      
      {/* COMMAND BAR (TOP MIDDLE) - Strict Ghosting */}
      <AnimatePresence>
        {showUI && (
          <ActionDock 
            isVisible={true} 
            onMine={handleMine} 
            onExplain={handleExplain}
            isExplaining={isExplaining}
            onNextLine={() => jumpToLineRelative('next')} 
            onPrevLine={() => jumpToLineRelative('prev')} 
            isFirst={currentTime < (dialogueData[0]?.timestampStart || 0) + 1} 
            isLast={currentTime > (dialogueData[dialogueData.length-1]?.timestampStart || 0) - 1} 
            onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)} 
            volume={volume}
            onVolumeChange={(v) => { setVolume(v); if(videoRef.current) videoRef.current.volume = v; }}
            isMuted={isMuted}
            onToggleMute={() => { const m = !isMuted; setIsMuted(m); if(videoRef.current) videoRef.current.muted = m; }}
            isDictionaryOpen={isDictionaryOpen}
            onToggleDictionary={() => setIsDictionaryOpen(!isDictionaryOpen)}
          />
        )}
      </AnimatePresence>

      <video 
        ref={videoRef} 
        src={videoSrc} 
        onTimeUpdate={() => !isScrubbing && setCurrentTime(videoRef.current?.currentTime || 0)} 
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} 
        className="w-full h-full object-contain z-0" 
        loop playsInline muted={isMuted} crossOrigin="anonymous" onClick={togglePlayback} 
      />

      {/* SYNC OFFSET INDICATOR (Toast) */}
      <AnimatePresence>
        {showOffsetIndicator && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] bg-black/60 backdrop-blur-xl border border-rose-500/30 px-8 py-5 rounded-[32px] flex items-center gap-4 shadow-[0_0_50px_rgba(244,63,94,0.3)]"
          >
             <History className="w-6 h-6 text-rose-400" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-rose-300 tracking-widest">Chronicle Offset</span>
                <span className="text-3xl font-black font-mono text-white tracking-tighter">
                   {subtitleOffset > 0 ? '+' : ''}{subtitleOffset.toFixed(1)}s
                </span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE RADICAL SCRUBBER (FLOATING CENTER BRIDGE) */}
      <AnimatePresence>
        {showUI && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-10 z-[100]"
          >
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-5 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-6">
                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 font-mono text-xs font-black text-rose-400 tracking-tighter shrink-0">
                  {formatTime(currentTime)}
                </div>
                <div 
                  className="relative h-1.5 flex-1 cursor-pointer group"
                  onMouseDown={(e) => { setIsScrubbing(true); handleSeek(e); }}
                  onMouseMove={(e) => isScrubbing && handleSeek(e)}
                  onMouseUp={() => setIsScrubbing(false)}
                  onMouseLeave={() => setIsScrubbing(false)}
                >
                  <div className="absolute -inset-y-4 inset-x-0 bg-transparent" />
                  <div className="absolute inset-0 bg-white/10 rounded-full" />
                  <div 
                    className="absolute inset-y-0 left-0 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.6)] transition-all"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                  <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] scale-0 group-hover:scale-100 transition-transform"
                    style={{ left: `${(currentTime / (duration || 1)) * 100}%`, marginLeft: '-8px' }}
                  />
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 font-mono text-xs font-black text-white/30 tracking-tighter shrink-0">
                  {formatTime(duration)}
                </div>
              </div>
              <div className="mt-3 flex justify-center items-center gap-2 opacity-20">
                <div className="h-1 w-1 rounded-full bg-white" />
                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Live Chronicle Feed</span>
                <div className="h-1 w-1 rounded-full bg-white" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentLine && !isModalOpen && (
          <motion.div 
            key={currentLine.id} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute bottom-60 left-0 right-0 z-40 pointer-events-none flex justify-center items-center"
          >
            <SubtitleOverlay line={currentLine} activeGroupId={activeGroupId} onTokenClick={(id) => { setActiveGroupId(id); videoRef.current?.pause(); setIsPaused(true); }} isPaused={isPaused} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{isDictionaryOpen && activeToken && <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[150]"><FrequencyDock targetToken={activeToken} episodeNodes={dialogueData} /></div>}</AnimatePresence>
      <AnimatePresence>{isSettingsOpen && <div className="fixed top-28 right-10 z-[150] w-80"><SyncManager /></div>}</AnimatePresence>
      <AnimatePresence>{isModalOpen && <SenseiModal explanation={explanation} isLoading={isExplaining} onClose={() => setExplanation(null)} />}</AnimatePresence>
      
      <AnimatePresence>
        {isMining && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[600] flex flex-col items-center justify-center">
             <Loader2 className="w-12 h-12 text-rose-400 animate-spin" />
             <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-rose-400">Mining Lexical Evidence</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimeStage;
