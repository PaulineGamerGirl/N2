
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flower, Heart, Sparkles, Check, Plus } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { ActivityCategory } from '../types';
import confetti from 'canvas-confetti';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState<ActivityCategory>('ANKI');
  const [duration, setDuration] = useState('30');
  const [summary, setSummary] = useState('');
  const [showVictory, setShowVictory] = useState(false);
  
  const addActivityLog = useProgressStore(state => state.addActivityLog);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const durationMins = Number(duration) || 0;

    // Update Store via Activity Log
    addActivityLog({
      timestamp: Date.now(),
      category: category,
      durationMinutes: durationMins,
      summary: summary || `Manual ${category.toLowerCase()} session`
    });
    
    // Trigger Victory Visuals
    setShowVictory(true);
    triggerConfetti();
    
    setTimeout(() => {
      setShowVictory(false);
      setDuration('30');
      setSummary('');
      setCategory('ANKI');
      onClose();
    }, 2500);
  };

  const triggerConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#f4acb7', '#d4a373', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 backdrop-blur-sm bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div 
          className="relative w-full max-w-md border rounded-[40px] shadow-2xl overflow-hidden bg-[#fffcfc] border-coquette-gold/30"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          {showVictory ? (
             <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Flower className="w-24 h-24 text-coquette-accent drop-shadow-[0_4px_10px_rgba(244,172,183,0.5)]" />
                </motion.div>
                <motion.h2 
                   className="text-4xl font-bold font-coquette-header text-coquette-text"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                >
                  Wonderful!
                </motion.h2>
                <p className="text-coquette-subtext font-coquette-body italic">
                  Entry recorded in your chronicle.
                </p>
             </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-8 border-b border-rose-50 bg-rose-50/20 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-coquette-accent">
                       <Plus className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold font-coquette-header text-coquette-text">Dear Diary...</h2>
                 </div>
                 <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors"><X className="w-6 h-6" /></button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 {/* Category Picker */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-coquette-subtext">Focus Area</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['ANKI', 'IMMERSION', 'GRAMMAR'] as ActivityCategory[]).map(cat => (
                         <button
                           key={cat} type="button"
                           onClick={() => setCategory(cat)}
                           className={`py-2 rounded-xl text-[10px] font-bold transition-all border
                             ${category === cat ? 'bg-coquette-accent border-coquette-accent text-white shadow-sm' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-rose-50'}
                           `}
                         >
                           {cat}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Duration */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-coquette-subtext">Duration (Minutes)</label>
                    <input 
                      type="number" required value={duration} onChange={e => setDuration(e.target.value)}
                      className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none font-bold text-coquette-text transition-all"
                      placeholder="e.g. 30"
                    />
                 </div>

                 {/* Summary */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-coquette-subtext">Reflections / Summary</label>
                    <textarea 
                      value={summary} onChange={e => setSummary(e.target.value)} placeholder="What did you learn today?"
                      className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none resize-none h-24 text-sm font-coquette-body italic transition-all"
                    />
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-4 rounded-[20px] bg-coquette-accent text-white font-bold font-coquette-header shadow-[0_4px_20px_rgba(244,172,183,0.4)] hover:bg-[#ff9eb0] transition-all flex items-center justify-center gap-2"
                 >
                   <Check className="w-4 h-4" /> Save Record
                 </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LogModal;
