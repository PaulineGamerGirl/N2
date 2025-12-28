
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Sparkles, 
  MonitorPlay, 
  Film, 
  Archive, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ViewMode, useImmersionStore } from '../../store/useImmersionStore';

interface TheaterLandingProps {
  onOpenUpload: () => void;
  mode?: ViewMode;
}

const TheaterLanding: React.FC<TheaterLandingProps> = ({ onOpenUpload, mode = 'standard' }) => {
  const isCinema = mode === 'cinema';
  const { series, activeSeriesId, activeEpisodeNumber, setLibraryOpen, ingestionQueue, clearQueue, removeFromQueue } = useImmersionStore();

  const selectedSeries = series.find(s => s.id === activeSeriesId);
  const isJITLoad = activeSeriesId && activeEpisodeNumber;
  const hasQueue = ingestionQueue.length > 0;

  // Derive queue stats
  const currentJob = ingestionQueue.find(q => q.status === 'processing');

  const handlePrimaryAction = () => {
    if (isJITLoad) {
      onOpenUpload();
    } else if (isCinema) {
      setLibraryOpen(true);
    } else {
      onOpenUpload();
    }
  };

  // If there's an active queue (and we are in cinema mode), show the Dashboard instead of landing
  if (isCinema && hasQueue) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-black text-white">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-rose-900/10 rounded-full blur-[150px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px]" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-30" />
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl w-full z-10 flex flex-col gap-8 h-full py-12">
           
           {/* Header */}
           <div className="flex items-center justify-between">
              <div>
                 <h1 className="text-4xl font-bold font-coquette-header italic tracking-tight">Ingestion Command</h1>
                 <p className="text-rose-400 font-bold uppercase tracking-[0.2em] text-xs mt-1">Batch Processing Engine Active</p>
              </div>
              <button onClick={clearQueue} className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white">
                 Clear History
              </button>
           </div>

           {/* Active Job Hero */}
           <div className="flex-1 flex flex-col justify-center items-center">
              {currentJob ? (
                <motion.div layoutId={currentJob.id} className="w-full max-w-2xl p-10 rounded-[40px] bg-white/5 backdrop-blur-xl border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.1)] relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/20"><div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${currentJob.progress}%` }} /></div>
                   <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-full border-2 border-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] bg-rose-500/10">
                         <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h2 className="text-3xl font-bold text-white mb-2 truncate">{currentJob.title}</h2>
                         <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${currentJob.phase === 'Cooling Down' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                                {currentJob.phase}
                            </span>
                            <span className="text-xs font-mono text-white/40">{currentJob.progress}%</span>
                         </div>
                      </div>
                   </div>
                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} animate={{ width: `${currentJob.progress}%` }} transition={{ ease: 'linear' }} />
                   </div>
                   <p className="text-center mt-6 text-white/50 text-xs uppercase tracking-[0.2em] font-black animate-pulse">
                      {currentJob.details || "Neural Link Synchronizing..."}
                   </p>
                </motion.div>
              ) : (
                <div className="text-center opacity-50">
                   <CheckCircle2 className="w-24 h-24 mx-auto mb-6 text-emerald-500" />
                   <h2 className="text-4xl font-bold font-coquette-header">All Tasks Complete</h2>
                   <p className="mt-2 text-white/60 uppercase tracking-widest text-sm">Ready for playback</p>
                </div>
              )}
           </div>

           {/* Queue Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ingestionQueue.filter(q => q.status !== 'processing').map(item => (
                 <div key={item.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${item.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30' : item.status === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : item.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/30'}`}>
                       {item.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : item.status === 'error' ? <AlertCircle className="w-5 h-5" /> : <MonitorPlay className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                       <p className={`text-[10px] uppercase tracking-wider font-bold ${item.status === 'completed' ? 'text-emerald-400' : 'text-white/30'}`}>{item.status}</p>
                    </div>
                    {item.status === 'completed' && <button onClick={() => removeFromQueue(item.id)} className="p-2 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-colors">×</button>}
                 </div>
              ))}
           </div>

        </motion.div>
      </div>
    );
  }

  // STANDARD LANDING (Original Logic)
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
