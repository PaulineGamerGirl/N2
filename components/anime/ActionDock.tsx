
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Pickaxe, Settings2, X, Volume2, VolumeX, Music, Sparkles, Loader2 } from 'lucide-react';
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
  onToggleMute
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
      className="fixed right-8 top-1/2 -translate-y-1/2 z-[150] flex items-center gap-4"
    >
      {/* Volume Slider Flyout */}
      <AnimatePresence>
        {showVolumeSlider && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-black/60 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl h-48 flex flex-col items-center justify-center gap-3"
          >
             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{Math.round(volume * 100)}%</span>
             <input 
               type="range"
               min="0"
               max="1"
               step="0.01"
               value={isMuted ? 0 : volume}
               onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
               className="h-32 w-1.5 accent-rose-500 bg-white/10 rounded-full appearance-none cursor-pointer orientation-vertical"
               style={{ WebkitAppearance: 'slider-vertical' } as any}
             />
             <Music className="w-3 h-3 text-white/20" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-black/30 backdrop-blur-3xl border border-white/5 rounded-[40px] py-8 px-2 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Back Button */}
        <button onClick={() => setViewMode('standard')} className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
        
        {/* Sync Settings */}
        <button onClick={onToggleSettings} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"><Settings2 className="w-4 h-4" /></button>

        <div className="h-px w-6 bg-white/5" />

        {/* Scene Navigation */}
        <button disabled={isFirst} onClick={onPrevLine} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-10 transition-all"><ChevronUp className="w-4 h-4" /></button>
        <button disabled={isLast} onClick={onNextLine} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-10 transition-all"><ChevronDown className="w-4 h-4" /></button>

        <div className="h-px w-6 bg-white/5" />

        {/* Explain Sentence (Sensei Insight) - NOW GLOWING */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onExplain} 
          disabled={isExplaining}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 relative group`}
          title="Explain Sentence"
        >
          {isExplaining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {/* Subtle pulse for the glow effect */}
          <div className="absolute inset-0 rounded-full bg-indigo-400 animate-pulse opacity-20 group-hover:opacity-40" />
        </motion.button>

        {/* Volume / Music Toggle */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleMute(); setShowVolumeSlider(!showVolumeSlider); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Mine Button (Primary Action) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMine}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110"
        >
          <Pickaxe className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ActionDock;
