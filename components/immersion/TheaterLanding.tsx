
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  MonitorPlay, 
  Film, 
  Archive, 
  PlayCircle
} from 'lucide-react';
import { ViewMode, useImmersionStore } from '../../store/useImmersionStore';

interface TheaterLandingProps {
  onOpenUpload: () => void;
  mode?: ViewMode;
}

const TheaterLanding: React.FC<TheaterLandingProps> = ({ onOpenUpload, mode = 'standard' }) => {
  const isCinema = mode === 'cinema';
  const { series, activeSeriesId, activeEpisodeNumber, setLibraryOpen } = useImmersionStore();

  const selectedSeries = series.find(s => s.id === activeSeriesId);
  const isJITLoad = activeSeriesId && activeEpisodeNumber;

  const handlePrimaryAction = () => {
    if (isJITLoad) {
      onOpenUpload();
    } else if (isCinema) {
      setLibraryOpen(true);
    } else {
      onOpenUpload();
    }
  };

  return (
    <div className={`h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden transition-all duration-700 ${isCinema ? 'bg-black text-white' : 'bg-[#fffcfc] text-coquette-text'}`}>
      
      {/* Background Ambience - Cinematic Dark Mode */}
      <AnimatePresence>
        {isCinema && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
             <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-rose-900/5 rounded-full blur-[150px]" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[120px]" />
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-30" />
          </motion.div>
        )}
      </AnimatePresence>

      {!isCinema && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-pink-100/30 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-coquette-gold/10 rounded-full blur-[60px] pointer-events-none" />
        </>
      )}
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full text-center z-10"
      >
        {isJITLoad ? (
          <div className="mb-16">
             <motion.h1 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="text-7xl md:text-8xl font-bold font-coquette-header text-white mb-4 italic tracking-tight drop-shadow-2xl"
             >
               {selectedSeries?.title || 'Unknown Series'}
             </motion.h1>
             
             <motion.div
               initial={{ y: 10, opacity: 0 }}
               animate={{ y: 0, opacity: 0.6 }}
               transition={{ delay: 0.2 }}
               className="flex items-center justify-center gap-4"
             >
                <div className="h-px w-12 bg-white/20" />
                <p className="text-2xl font-coquette-body italic text-rose-400 tracking-[0.3em] uppercase">
                  Chapter {activeEpisodeNumber}
                </p>
                <div className="h-px w-12 bg-white/20" />
             </motion.div>
          </div>
        ) : (
          <div className="mb-16">
            <h1 className={`text-6xl md:text-7xl font-bold font-coquette-header mb-6 tracking-tight italic transition-colors ${isCinema ? 'text-white' : 'text-coquette-text'}`}>
              {isCinema ? 'Cinema Immersion' : 'Immersion Theater'}
            </h1>
            <p className={`text-xl font-coquette-body italic max-w-lg mx-auto leading-relaxed ${isCinema ? 'text-gray-400' : 'text-coquette-subtext'}`}>
              Transform your personal library into a cinematic language lab. Explore the <strong>Archive</strong> to begin.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-8 items-center">
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrimaryAction}
            className={`
              group relative inline-flex items-center gap-5 px-16 py-7 rounded-full font-bold shadow-[0_25px_60px_rgba(244,63,94,0.4)] transition-all
              ${isCinema || isJITLoad ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-rose-500 bg-[length:200%_auto] hover:bg-right text-white' : 'bg-coquette-accent text-white hover:bg-[#ff9eb0]'}
            `}
          >
            {isJITLoad ? <MonitorPlay className="w-8 h-8" /> : <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />}
            <span className="text-2xl uppercase tracking-[0.25em] font-black">
              {isJITLoad ? 'Mount Episode File' : (isCinema ? 'Open Chronicle Library' : 'New Ingestion')}
            </span>
            
            {/* Pulsing Outer Ring */}
            <div className={`absolute -inset-3 rounded-full border-2 animate-pulse opacity-20 pointer-events-none ${isCinema || isJITLoad ? 'border-rose-400' : 'border-rose-200'}`} />
          </motion.button>
          
          {isJITLoad && (
            <button 
              onClick={() => setLibraryOpen(true)}
              className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-600 hover:text-rose-400 transition-all hover:tracking-[0.6em] mt-4"
            >
              Switch Episode
            </button>
          )}
        </div>

        {/* Minimalist Tech Footer */}
        <div className={`mt-24 flex items-center justify-center gap-10 text-[10px] font-black uppercase tracking-[0.4em] transition-colors ${isCinema ? 'text-gray-800' : 'text-gray-300'}`}>
           <div className="flex items-center gap-3"><Film className="w-4 h-4 opacity-50" /> Native MKV / MP4</div>
           <div className="flex items-center gap-3"><Sparkles className="w-4 h-4 opacity-50" /> Gemini Neural Link</div>
           <div className="flex items-center gap-3"><Archive className="w-4 h-4 opacity-50" /> Local Vault</div>
        </div>
      </motion.div>
    </div>
  );
};

export default TheaterLanding;
