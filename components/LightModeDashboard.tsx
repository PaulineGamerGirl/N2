import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { itemVariants, containerVariants } from '../constants';
import CircularProgress from './CircularProgress';
import { useProgressStore } from '../store/progressStore';
import { BookOpen, Clock, PenTool, Award, Flower, Heart, X, Calendar } from 'lucide-react';
import CompactCalendarWidget from './CompactCalendarWidget';
import { format, eachDayOfInterval, endOfMonth, getDay, addMonths, isSameDay } from 'date-fns';

interface LightModeDashboardProps {
  onOpenLogModal: () => void;
}

const LightModeDashboard: React.FC<LightModeDashboardProps> = ({ onOpenLogModal }) => {
  const { vocabCount, immersionMinutes, grammarPoints, streak, completedDates } = useProgressStore();
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false);

  const VOCAB_GOAL = 8000;
  const IMMERSION_GOAL_HOURS = 600;
  const GRAMMAR_GOAL = 200;
  const immersionHours = Math.floor(immersionMinutes / 60);

  // Calculate Rank
  const getRank = (vocab: number) => {
    if (vocab < 800) return "Beginner";
    if (vocab < 1500) return "Scholar";
    if (vocab < 3750) return "Adept";
    if (vocab < 6000) return "Specialist";
    return "Master";
  };

  return (
    <motion.div 
      className="w-full grid grid-cols-12 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* LEFT PANEL: STATS & PROGRESS (Span 8) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        
        {/* TOP ROW: HERO STATS */}
        <motion.div 
          variants={itemVariants} 
          className="relative bg-white border border-coquette-border rounded-[40px] p-6 shadow-[8px_8px_24px_rgba(244,172,183,0.15)] overflow-hidden group"
        >
          {/* Background Decor */}
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
             <Flower className="w-40 h-40 text-coquette-accent" />
          </div>

          <h2 className="text-xl font-coquette-header text-coquette-text font-semibold mb-6 flex items-center gap-2">
             <Flower className="w-5 h-5 text-coquette-accent" /> Blossoming Knowledge
          </h2>
          
          <div className="flex flex-wrap justify-around items-center gap-8">
            <CircularProgress 
              value={vocabCount} 
              max={VOCAB_GOAL} 
              label="Vocabulary"
              subLabel={`${vocabCount.toLocaleString()} / ${VOCAB_GOAL.toLocaleString()}`}
              color="#f4acb7" 
            />
            <CircularProgress 
              value={immersionHours} 
              max={IMMERSION_GOAL_HOURS} 
              label="Immersion"
              subLabel={`${immersionHours}h / ${IMMERSION_GOAL_HOURS}h`}
              color="#ccd5ae" 
            />
          </div>
        </motion.div>

        {/* BOTTOM GRID: SECONDARY STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Grammar Stat */}
            <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[25px] p-5 hover:border-coquette-accent shadow-sm transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-coquette-subtext">Grammar Points</div>
                  <div className="text-2xl font-bold font-coquette-header text-coquette-text">
                    {grammarPoints} / {GRAMMAR_GOAL}
                  </div>
                </div>
              </div>
              <div className="w-full h-1.5 mt-4 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full bg-purple-300" style={{ width: `${Math.min(100, (grammarPoints / GRAMMAR_GOAL) * 100)}%` }}></div>
              </div>
            </motion.div>

            {/* Playtime Stat */}
            <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[25px] p-5 hover:border-coquette-gold shadow-sm transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-coquette-subtext">Total Study Time</div>
                  <div className="text-2xl font-bold font-coquette-header text-coquette-text">
                    {(immersionMinutes / 60).toFixed(1)} hrs
                  </div>
                </div>
              </div>
              <div className="w-full h-1.5 mt-4 rounded-full overflow-hidden bg-gray-100">
                 <div className="h-full rounded-full bg-blue-300" style={{ width: `${Math.min(100, (immersionMinutes / (IMMERSION_GOAL_HOURS * 60)) * 100)}%` }}></div>
              </div>
            </motion.div>

            {/* Streak Card */}
            <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[25px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center">
               <div className="text-xs uppercase tracking-widest mb-1 text-coquette-gold font-bold font-coquette-body">Dedication</div>
               <div className="text-4xl font-bold font-coquette-header text-coquette-text">
                 {streak} <span className="text-sm opacity-60">DAYS</span>
               </div>
               {/* Ribbon Decor */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coquette-accent to-coquette-gold opacity-50"></div>
            </motion.div>

            {/* Log Button */}
            <motion.div variants={itemVariants} className="row-span-1 md:col-span-1">
               <button 
                  onClick={onOpenLogModal}
                  className="w-full h-full bg-[#fff5f5] border border-coquette-accent/50 text-coquette-text rounded-[25px] p-4 flex items-center justify-center gap-3 hover:shadow-md hover:bg-[#ffebeb] transition-all group"
               >
                  <div className="p-2 bg-white shadow-sm text-coquette-accent rounded-full group-hover:scale-110 transition-transform">
                     <PenTool className="w-5 h-5" />
                  </div>
                  <span className="font-coquette-script text-2xl font-bold">Dear Diary...</span>
               </button>
            </motion.div>
            
            {/* Status Card (Span 2 on mobile) */}
            <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 bg-white border border-coquette-border rounded-[25px] p-5 flex items-center justify-between hover:bg-coquette-bg transition-colors shadow-sm">
               <div>
                  <div className="text-xs uppercase tracking-widest mb-1 text-coquette-gold font-bold">Current Status</div>
                  <div className="text-lg font-bold font-coquette-header text-coquette-text">{getRank(vocabCount)}</div>
               </div>
               <div className="w-10 h-10 rounded-full bg-coquette-bg flex items-center justify-center border border-coquette-gold/30">
                  <Award className="w-6 h-6 text-coquette-gold" />
               </div>
            </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL: COMPACT CALENDAR (Span 4) */}
      <div className="col-span-12 lg:col-span-4 h-full min-h-[400px]">
         <CompactCalendarWidget onOpenYearlyView={() => setIsYearlyModalOpen(true)} />
      </div>

      {/* YEARLY JOURNEY MODAL */}
      <AnimatePresence>
        {isYearlyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsYearlyModalOpen(false)}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white border-2 border-coquette-border rounded-[40px] shadow-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative z-10"
             >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-coquette-header text-coquette-text">My Yearly Journey</h2>
                    <p className="text-coquette-subtext font-coquette-body italic">"Constancy is the foundation of virtues."</p>
                  </div>
                  <button onClick={() => setIsYearlyModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, monthIdx) => {
                    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
                    const startOfMonthDate = addMonths(currentYearStart, monthIdx);
                    const daysInMonth = eachDayOfInterval({
                      start: startOfMonthDate,
                      end: endOfMonth(startOfMonthDate)
                    });
                    
                    // Pad start
                    const startDay = getDay(startOfMonthDate);
                    const padding = Array(startDay).fill(null);

                    return (
                      <div key={monthIdx} className="bg-[#fffcfc] rounded-2xl p-4 border border-gray-100 hover:border-coquette-accent/30 transition-colors">
                        <h3 className="text-center font-coquette-header text-coquette-text mb-3 text-sm">
                          {format(startOfMonthDate, 'MMMM')}
                        </h3>
                        <div className="grid grid-cols-7 gap-1">
                          {/* Week headers */}
                          {['S','M','T','W','T','F','S'].map((d, i) => (
                             <div key={i} className="text-[8px] text-center text-gray-300 font-bold">{d}</div>
                          ))}
                          
                          {padding.map((_, i) => <div key={`pad-${i}`} />)}
                          
                          {daysInMonth.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isCompleted = completedDates[dateStr];
                            
                            return (
                              <div key={dateStr} className="aspect-square flex items-center justify-center">
                                <div className={`w-2 h-2 rounded-full transition-all duration-300
                                   ${isCompleted 
                                     ? 'bg-coquette-accent scale-125 shadow-[0_0_4px_#f4acb7]' 
                                     : 'bg-gray-100'}
                                `} title={format(day, 'MMM d')} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default LightModeDashboard;