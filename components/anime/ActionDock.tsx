import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Pickaxe, Settings2, X, Volume2, VolumeX, Music, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { useImmersionStore } from '../../store/useImmersionStore';

interface ActionDockProps {
  isVisible: boolean;
  onMine: () => void;
  onNextLine: () => void;
  onPrevLine: () => void;
  onExplain: () => void;
  isExplaining: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleSettings: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isDictionaryOpen: boolean;
  onToggleDictionary: () => void;
}

const ActionDock: React.FC<ActionDockProps> = ({ 
  isVisible, 
  onMine, 
  onNextLine, 
  onPrevLine, 
  onExplain,
  isExplaining,
  isFirst, 
  isLast,
  onToggleSettings,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  isDictionaryOpen,
  onToggleDictionary
}) => {
  const { setViewMode } = useImmersionStore();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Reset the volume slider whenever the dock hides
  useEffect(() => {
    if (!isVisible) {
      setShowVolumeSlider(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      className="fixed right-8 top-[35%] -translate-y-1/2 z-[150] flex items-center gap-4 min-h-[300px]"
    >
      {/* Volume Slider Flyout */}
      <AnimatePresence>
        {showVolumeSlider && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-black/80 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl h-56 flex flex-col items-center justify-center gap-4 shadow-2xl"
          >
             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{Math.round(volume * 100)}%</span>
             <div className="flex-1 w-1.5 relative bg-white/10 rounded-full overflow-hidden">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-10"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', width: '200px', left: '-100px' } as any}
                />
                <div 
                  className="absolute bottom-0 left-0 w-full bg-rose-500 transition-all duration-150"
                  style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                />
             </div>
             <Music className="w-3.5 h-3.5 text-rose-400" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[40px] py-8 px-3 flex flex-col items-center gap-6 shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative">
        {/* Decorative Top Accent */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-500/40" />

        {/* Back Button */}
        <button onClick={() => setViewMode('standard')} className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm group"><X className="w-4 h-4 group-hover:rotate-90 transition-transform" /></button>
        
        {/* Sync Settings */}
        <button onClick={onToggleSettings} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/30 hover:bg-white/10 hover:text-white transition-all" title="Sync Settings"><Settings2 className="w-4 h-4" /></button>

        <div className="h-px w-6 bg-white/10" />

        {/* Dictionary Toggle */}
        <button 
          onClick={onToggleDictionary}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDictionaryOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}
          title="Frequency Stats"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Scene Navigation */}
        <div className="flex flex-col gap-2">
          <button disabled={isFirst} onClick={onPrevLine} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/30 hover:bg-white/10 hover:text-white disabled:opacity-5 transition-all"><ChevronUp className="w-4 h-4" /></button>
          <button disabled={isLast} onClick={onNextLine} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/30 hover:bg-white/10 hover:text-white disabled:opacity-5 transition-all"><ChevronDown className="w-4 h-4" /></button>
        </div>

        <div className="h-px w-6 bg-white/10" />

        {/* Explain Sentence (Sensei Insight) */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onExplain} 
          disabled={isExplaining}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 relative group overflow-hidden`}
          title="Explain Sentence"
        >
          {isExplaining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <div className="absolute inset-0 rounded-full bg-indigo-400 animate-pulse opacity-20 group-hover:opacity-40" />
        </motion.button>

        {/* Volume / Music Toggle */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleMute(); setShowVolumeSlider(!showVolumeSlider); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white/5 text-white/30 hover:text-white'}`}
          title="Volume Control"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {!isMuted && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-black" />}
        </button>

        {/* Mine Button (Primary Action) */}
        <motion.button
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMine}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40 scale-110 group relative"
          title="Capture Fragment"
        >
          <Pickaxe className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
          <div className="absolute -inset-1 rounded-full border border-emerald-500/30 animate-ping opacity-20" />
        </motion.button>
        
        {/* Decorative Bottom Accent */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-500/40" />
      </div>
    </motion.div>
  );
};

export default ActionDock;