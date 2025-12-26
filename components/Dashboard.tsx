
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants, itemVariants } from '../constants';
import CircularProgress from './CircularProgress';
import Countdown from './Countdown';
import { useProgressStore, Keepsake } from '../store/progressStore';
import { CAMPAIGN_PHASES } from '../data/campaign';
import { BookOpen, Clock, PenTool, Award, Flower, X, Calendar, MessageCircle, Scroll, Tv, Database } from 'lucide-react';
import { isWithinInterval, format, eachDayOfInterval, endOfMonth, getDay, addMonths } from 'date-fns';
import CompactCalendarWidget from './CompactCalendarWidget';
import DataManagementModal from './DataManagementModal';

interface DashboardProps {
  onOpenLogModal: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenLogModal }) => {
  const { baseVocab, manualVocabCount, masteredChapters, grammarDatabase, streak, completedDates, keepsakes, vocabCount: legacyVocabCount } = useProgressStore();
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- NEW DETERMINISTIC VOCAB CALCULATION ---
  // If baseVocab exists (new logic), use it. Else fallback to legacy vocabCount for transition.
  const calculatedVocab = useMemo(() => {
    const heartCount = Object.keys(completedDates || {}).length;
    return (baseVocab || legacyVocabCount || 2500) + (manualVocabCount || 0) + (heartCount * 20);
  }, [baseVocab, legacyVocabCount, manualVocabCount, completedDates]);

  // --- AGGREGATED STUDY METRICS (Real-time with Background Support) ---
  const [liveMetrics, setLiveMetrics] = useState({
    output: 0,
    grammar: 0,
    anki: 0,
    immersion: 0
  });

  useEffect(() => {
    const calculateLiveTotals = () => {
      const now = Date.now();
      const getLiveTime = (totalKey: string, startKey: string) => {
        const total = Number(localStorage.getItem(totalKey) || 0);
        const start = localStorage.getItem(startKey);
        if (start) {
          const sessionDuration = Math.floor((now - Number(start)) / 1000);
          return total + Math.max(0, sessionDuration);
        }
        return total;
      };

      setLiveMetrics({
        output: getLiveTime('messenger_total_time', 'messenger_session_start'),
        grammar: getLiveTime('grammar_total_time', 'grammar_session_start'),
        anki: getLiveTime('anki_total_time', 'anki_session_start'),
        immersion: getLiveTime('immersion_total_time', 'immersion_session_start')
      });
    };

    calculateLiveTotals();
    const interval = setInterval(calculateLiveTotals, 1000); 
    window.addEventListener('storage-update', calculateLiveTotals);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage-update', calculateLiveTotals);
    };
  }, []);

  // --- DYNAMIC GRAMMAR CALCULATION ---
  const masteredGrammarPointsCount = useMemo(() => {
    let count = 0;
    masteredChapters.forEach(chapterId => {
      const points = grammarDatabase[chapterId];
      if (points) count += points.length;
    });
    return count;
  }, [masteredChapters, grammarDatabase]);

  // Calculate Immersion (3x Multiplier Logic)
  const calculateImmersionMinutes = (items: Keepsake[]) => {
    let rawMinutes = 0;
    items.forEach(item => {
      const itemMins = item.type === 'MANGA' ? (item.durationOrVolumes * 45) : item.durationOrVolumes;
      rawMinutes += itemMins || 0;
    });
    return rawMinutes * 3;
  };

  const keepsakeEffectiveMins = calculateImmersionMinutes(keepsakes);
  const timerEffectiveMins = (liveMetrics.immersion / 60) * 3;
  const totalEffectiveImmersionMins = keepsakeEffectiveMins + timerEffectiveMins;

  // Total Calculations (Hours)
  const outputHours = liveMetrics.output / 3600;
  const grammarHours = liveMetrics.grammar / 3600;
  const immersionHours = totalEffectiveImmersionMins / 60;
  const ankiHours = liveMetrics.anki / 3600;
  const totalStudyHours = outputHours + grammarHours + immersionHours + ankiHours;

  const totalForCalc = totalStudyHours || 1;
  const outputPct = (outputHours / totalForCalc) * 100;
  const grammarPct = (grammarHours / totalForCalc) * 100;
  const immersionPct = (immersionHours / totalForCalc) * 100;
  const ankiPct = (ankiHours / totalForCalc) * 100;

  const donutGradient = `conic-gradient(
    #f4acb7 0% ${outputPct}%, 
    #a5b4fc ${outputPct}% ${outputPct + grammarPct}%, 
    #ccd5ae ${outputPct + grammarPct}% ${outputPct + grammarPct + immersionPct}%,
    #d4a373 ${outputPct + grammarPct + immersionPct}% 100%
  )`;

  const VOCAB_GOAL = 8000;
  const GRAMMAR_GOAL = 200;
  const IMMERSION_GOAL_HOURS = 600;

  const getManilaTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const manilaOffset = 8 * 60 * 60000; 
    return new Date(utc + manilaOffset);
  };

  useEffect(() => {
    setCurrentDate(getManilaTime());
    const timer = setInterval(() => {
      setCurrentDate(getManilaTime());
    }, 60000); 
    return () => clearInterval(timer);
  }, []);
  
  const getRank = (vocab: number) => {
    if (vocab < 800) return "Beginner";
    if (vocab < 1500) return "Scholar";
    if (vocab < 3750) return "Adept";
    if (vocab < 6000) return "Specialist";
    return "Master";
  };

  const formattedDate = format(currentDate, "EEEE, MMMM do, yyyy");
  const currentPhase = CAMPAIGN_PHASES.find(phase => 
    isWithinInterval(currentDate, { start: new Date(phase.startDate), end: new Date(phase.endDate) })
  );

  return (
    <motion.div 
      className="p-6 lg:p-10 w-full max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-coquette-gold/30 pb-6">
        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
             <div className="flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-coquette-gold" />
                 <span className="text-sm font-bold tracking-widest text-coquette-subtext font-coquette-body uppercase">
                   {formattedDate}
                 </span>
             </div>
             <button 
                onClick={() => setIsDataModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-coquette-gold/30 text-[10px] font-bold uppercase tracking-widest text-coquette-subtext hover:text-coquette-text hover:bg-coquette-bg transition-all"
             >
                <Database className="w-3 h-3" /> Data Vault
             </button>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight font-coquette-header text-coquette-text italic">
            Pauline's Journal
          </h1>
          <p className="text-coquette-subtext font-coquette-body italic">
            Chapter: 
            <span className="text-coquette-accent font-bold ml-1">
              {currentPhase ? currentPhase.title : 'Intermission'}
            </span> 
            <span className="mx-2 opacity-50">|</span> 
            Status: 
            <span className="text-coquette-text font-bold ml-1">
              {getRank(calculatedVocab)}
            </span>
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Countdown />
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="w-full grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* TOP ROW: HERO STATS */}
          <motion.div 
            variants={itemVariants} 
            className="relative bg-white border border-coquette-border rounded-[40px] p-8 shadow-[8px_8px_24px_rgba(244,172,183,0.15)] overflow-hidden group min-h-[300px]"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
               <Flower className="w-40 h-40 text-coquette-accent" />
            </div>
            <h2 className="text-xl font-coquette-header text-coquette-text font-semibold mb-8 flex items-center gap-2">
               <Flower className="w-5 h-5 text-coquette-accent" /> Blossoming Knowledge
            </h2>
            <div className="flex flex-col md:flex-row justify-around items-center gap-12">
              <CircularProgress 
                value={calculatedVocab} 
                max={VOCAB_GOAL} 
                label="Vocabulary"
                subLabel={`${calculatedVocab.toLocaleString()} / ${VOCAB_GOAL.toLocaleString()}`}
                color="#f4acb7" 
              />
              <div className="relative flex flex-col items-center justify-center" style={{ width: 200, height: 200 }}>
                  <div className="absolute inset-[-20px] rounded-full border border-coquette-gold/20 opacity-50 group-hover:scale-105 transition-transform duration-700"></div>
                  <div className="w-full h-full rounded-full relative shadow-inner" style={{ background: donutGradient }}>
                    <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center z-10">
                       <span className="text-3xl font-bold font-coquette-header text-coquette-text">
                         {totalStudyHours.toFixed(1)}h
                       </span>
                       <span className="text-xs uppercase tracking-wider mt-1 font-coquette-body font-bold text-coquette-subtext">
                         Total Study
                       </span>
                       <div className="text-[9px] text-coquette-gold mt-1">
                          Goal: {IMMERSION_GOAL_HOURS}h
                       </div>
                    </div>
                  </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-[10px] font-bold tracking-wide font-coquette-body">
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f4acb7]"></span>
                  <span className="text-coquette-text">Output ({outputHours.toFixed(1)}h)</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a5b4fc]"></span>
                  <span className="text-coquette-text">Grammar ({grammarHours.toFixed(1)}h)</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ccd5ae]"></span>
                  <span className="text-coquette-text">Immersion (x3) ({immersionHours.toFixed(1)}h)</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373]"></span>
                  <span className="text-coquette-text">Anki ({ankiHours.toFixed(1)}h)</span>
               </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[25px] p-5 hover:border-coquette-accent shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-100 text-indigo-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-coquette-subtext">Grammar Points</div>
                    <div className="text-2xl font-bold font-coquette-header text-coquette-text">
                      {masteredGrammarPointsCount} / {GRAMMAR_GOAL}
                    </div>
                  </div>
                </div>
                <div className="w-full h-1.5 mt-4 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full rounded-full bg-indigo-300" style={{ width: `${Math.min(100, (masteredGrammarPointsCount / GRAMMAR_GOAL) * 100)}%` }}></div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[25px] p-5 hover:border-coquette-gold shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100 text-green-500">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-coquette-subtext">Effective Immersion</div>
                    <div className="text-2xl font-bold font-coquette-header text-coquette-text">
                      {immersionHours.toFixed(1)} hrs
                    </div>
                  </div>
                </div>
                <div className="w-full h-1.5 mt-4 rounded-full overflow-hidden bg-gray-100">
                   <div className="h-full rounded-full bg-[#ccd5ae]" style={{ width: `${Math.min(100, (immersionHours / IMMERSION_GOAL_HOURS) * 100)}%` }}></div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[25px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center">
                 <div className="text-xs uppercase tracking-widest mb-1 text-coquette-gold font-bold font-coquette-body">Dedication</div>
                 <div className="text-4xl font-bold font-coquette-header text-coquette-text">
                   {streak} <span className="text-sm opacity-60">DAYS</span>
                 </div>
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coquette-accent to-coquette-gold opacity-50"></div>
              </motion.div>

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
              
              <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 bg-white border border-coquette-border rounded-[25px] p-5 flex items-center justify-between hover:bg-coquette-bg transition-colors shadow-sm">
                 <div>
                    <div className="text-xs uppercase tracking-widest mb-1 text-coquette-gold font-bold">Current Status</div>
                    <div className="text-lg font-bold font-coquette-header text-coquette-text">{getRank(calculatedVocab)}</div>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-coquette-bg flex items-center justify-center border border-coquette-gold/30">
                    <Award className="w-6 h-6 text-coquette-gold" />
                 </div>
              </motion.div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 h-full min-h-[400px]">
           <CompactCalendarWidget onOpenYearlyView={() => setIsYearlyModalOpen(true)} />
        </div>
      </div>

      <AnimatePresence>
        {isYearlyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsYearlyModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-2 border-coquette-border rounded-[40px] shadow-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-coquette-header text-coquette-text">My Yearly Journey</h2>
                    <p className="text-coquette-subtext font-coquette-body italic">"Constancy is the foundation of virtues."</p>
                  </div>
                  <button onClick={() => setIsYearlyModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, monthIdx) => {
                    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
                    const startOfMonthDate = addMonths(currentYearStart, monthIdx);
                    const daysInMonth = eachDayOfInterval({ start: startOfMonthDate, end: endOfMonth(startOfMonthDate) });
                    const startDay = getDay(startOfMonthDate);
                    const padding = Array(startDay).fill(null);
                    return (
                      <div key={monthIdx} className="bg-[#fffcfc] rounded-2xl p-4 border border-gray-100 hover:border-coquette-accent/30 transition-colors">
                        <h3 className="text-center font-coquette-header text-coquette-text mb-3 text-sm">{format(startOfMonthDate, 'MMMM')}</h3>
                        <div className="grid grid-cols-7 gap-1">
                          {['S','M','T','W','T','F','S'].map((d, i) => (<div key={i} className="text-[8px] text-center text-gray-300 font-bold">{d}</div>))}
                          {padding.map((_, i) => <div key={`pad-${i}`} />)}
                          {daysInMonth.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isCompleted = completedDates[dateStr];
                            return (
                              <div key={dateStr} className="aspect-square flex items-center justify-center">
                                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-coquette-accent scale-125 shadow-[0_0_4px_#f4acb7]' : 'bg-gray-100'}`} title={format(day, 'MMM d')} />
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

      <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} />
    </motion.div>
  );
};

export default Dashboard;
