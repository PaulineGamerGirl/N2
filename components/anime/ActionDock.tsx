
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pickaxe, Settings2, X, Volume2, VolumeX, Music, Sparkles, Loader2, BookOpen } from 'lucide-react';
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
  const { setViewMode, clearPlaylist } = useImmersionStore();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    if (!isVisible) setShowVolumeSlider(false);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -50, x: '-50%', opacity: 0 }}
      animate={{ y: 0, x: '-50%', opacity: 1 }}
      exit={{ y: -50, x: '-50%', opacity: 0 }}
      className="fixed top-8 left-1/2 z-[150] flex items-center gap-4"
    >
      <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Exit Logic */}
        <button 
          onClick={() => setViewMode('standard')} 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all group"
          title="Exit Cinema"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
        </button>

        <div className="h-6 w-px bg-white/10" />

        {/* Playback Navigation */}
        <div className="flex items-center gap-2">
          <button 
            disabled={isFirst} 
            onClick={onPrevLine} 
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-white/30 hover:bg-white/10 hover:text-white disabled:opacity-5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            disabled={isLast} 
            onClick={onNextLine} 
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-white/30 hover:bg-white/10 hover:text-white disabled:opacity-5 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* Intelligence Tools */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleDictionary}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDictionaryOpen ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
            title="Frequency Dictionary"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExplain} 
            disabled={isExplaining}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 relative group`}
            title="Sensei Breakdown"
          >
            {isExplaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </motion.button>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* Capture Action */}
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMine}
          className="px-5 h-11 rounded-full flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 group font-black text-[10px] uppercase tracking-widest"
          title="Mine Word"
        >
          <Pickaxe className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
          <span>Mine</span>
        </motion.button>

        <div className="h-6 w-px bg-white/10" />

        {/* Settings & Audio */}
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={onToggleSettings} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          
          <div className="relative group/vol">
            <button 
              onClick={onToggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            {/* Horizontal Volume Popout */}
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 100, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="absolute left-full ml-2 top-0 h-10 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center px-4 overflow-hidden shadow-2xl"
                >
                   <input 
                    type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-20 accent-rose-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActionDock;
