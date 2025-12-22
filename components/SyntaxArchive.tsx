
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, FileText, Check, Database, Eye, CheckSquare, Square, PenTool, Book, Sparkles, Save, Play, Timer as TimerIcon, GraduationCap, Zap, ListChecks } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { containerVariants, itemVariants } from '../constants';
import { ExamMode } from '../types';
import SimulationModal from './SimulationModal';
import GrammarListModal from './GrammarListModal';
import { ParsedGrammarPoint } from '../utils/grammarParser';

// --- Types & Data ---
type ModuleId = 'genki1' | 'genki2' | 'quartet1' | 'quartet2';

interface GrammarModule {
  id: ModuleId;
  title: string;
  startChapter: number;
  endChapter: number;
}

const SYLLABUS: GrammarModule[] = [
  { id: 'genki1', title: 'Genki I (N5)', startChapter: 1, endChapter: 12 },
  { id: 'genki2', title: 'Genki II (N4)', startChapter: 13, endChapter: 23 },
  { id: 'quartet1', title: 'Quartet I (N3)', startChapter: 1, endChapter: 6 },
  { id: 'quartet2', title: 'Quartet II (N2)', startChapter: 7, endChapter: 12 },
];

const SyntaxArchive: React.FC = () => {
  const { 
    masteredChapters, 
    toggleChapter, 
    setModuleChapters,
    grammarContext, 
    setGrammarContext,
    grammarDatabase,
    importGrammar,
    addActivityLog
  } = useProgressStore();

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'genki2': true,
    'quartet1': true
  });
  
  // Modal State
  const [modalData, setModalData] = useState<{ isOpen: boolean; title: string; points: ParsedGrammarPoint[] }>({
    isOpen: false,
    title: '',
    points: []
  });

  const [localContext, setLocalContext] = useState(grammarContext);
  const [isSaved, setIsSaved] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [examMode, setExamMode] = useState<ExamMode>('GRAMMAR');
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // --- DRILL ENGINE OVERHAUL STATE ---
  const [isJLPTMode, setIsJLPTMode] = useState(true);
  const [selectedSubPoints, setSelectedSubPoints] = useState<Set<string>>(new Set());

  // Derive all available points from mastered chapters
  const availablePoints = useMemo(() => {
    const points: ParsedGrammarPoint[] = [];
    masteredChapters.forEach(chapId => {
      if (grammarDatabase[chapId]) {
        points.push(...grammarDatabase[chapId]);
      }
    });
    return points;
  }, [masteredChapters, grammarDatabase]);

  const toggleSubPoint = (pointName: string) => {
    const newSet = new Set(selectedSubPoints);
    if (newSet.has(pointName)) newSet.delete(pointName);
    else newSet.add(pointName);
    setSelectedSubPoints(newSet);
  };

  const toggleAllSubPoints = () => {
    if (selectedSubPoints.size === availablePoints.length) {
      setSelectedSubPoints(new Set());
    } else {
      setSelectedSubPoints(new Set(availablePoints.map(p => p.point)));
    }
  };

  // --- PERSISTENT GRAMMAR TIMER STATE ---
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    setLocalContext(grammarContext);
  }, [grammarContext]);

  useEffect(() => {
    const updateTimerDisplay = () => {
      const startTime = localStorage.getItem('grammar_session_start');
      if (startTime) {
        setIsTimerRunning(true);
        const duration = Math.floor((Date.now() - Number(startTime)) / 1000);
        setDisplaySeconds(Math.max(0, duration));
      } else {
        setIsTimerRunning(false);
        setDisplaySeconds(0);
      }
    };

    updateTimerDisplay();
    const interval = setInterval(updateTimerDisplay, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC ---
  const unlockedChapters = Object.keys(grammarDatabase).filter(key => 
    grammarDatabase[key] && grammarDatabase[key].length > 0
  );
  const unlockedCount = unlockedChapters.length;
  const selectedCount = masteredChapters.length;
  const totalChapters = 35; 
  const progressPercent = Math.min(100, (unlockedCount / totalChapters) * 100);

  const getRankTitle = () => {
    if (unlockedCount < 12) return 'Novice Scribe';
    if (unlockedCount < 23) return 'Apprentice';
    if (unlockedCount < 29) return 'Scholar';
    return 'Grand Master';
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBulkToggle = (e: React.MouseEvent, mod: GrammarModule) => {
    e.stopPropagation();
    const chapterCount = mod.endChapter - mod.startChapter + 1;
    const allIds: string[] = [];
    for (let i = 0; i < chapterCount; i++) {
      allIds.push(`${mod.id}_${mod.startChapter + i}`);
    }
    const allSelected = allIds.every(id => masteredChapters.includes(id));
    setModuleChapters(allIds, !allSelected);
  };

  const handleOpenGrammarModal = (e: React.MouseEvent, title: string, uniqueId: string) => {
    e.stopPropagation();
    const points = grammarDatabase[uniqueId] || [];
    setModalData({ isOpen: true, title, points });
  };

  const handleSaveContext = () => {
    const count = importGrammar(localContext);
    setImportCount(count);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSimulate = () => {
    if (selectedCount === 0) return;
    setIsSimulationOpen(true);
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      const startTime = Number(localStorage.getItem('grammar_session_start'));
      const sessionSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (sessionSeconds >= 60) {
        addActivityLog({
          timestamp: Date.now(),
          category: 'GRAMMAR',
          durationMinutes: Math.floor(sessionSeconds / 60),
          summary: 'Grammar Study Session'
        });
      }
      const total = Number(localStorage.getItem('grammar_total_time') || 0);
      localStorage.setItem('grammar_total_time', (total + sessionSeconds).toString());
      localStorage.removeItem('grammar_session_start');
      window.dispatchEvent(new Event('storage-update'));
      setIsTimerRunning(false);
      setDisplaySeconds(0);
    } else {
      localStorage.setItem('grammar_session_start', Date.now().toString());
      setIsTimerRunning(true);
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      className="p-6 lg:p-10 w-full max-w-[1600px] mx-auto h-full flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8 p-6 relative overflow-visible transition-all duration-300 bg-white border border-coquette-border rounded-[30px] shadow-sm">
         <div className="flex justify-between items-end mb-4 relative z-20">
            <div>
               <h1 className="text-3xl font-bold tracking-widest font-coquette-header text-coquette-text">
                 GRAMMAR NOTES
               </h1>
               <div className="flex items-center gap-2 font-mono text-sm mt-1 text-coquette-subtext">
                 <span>COLLECTION: {unlockedCount}/{totalChapters}</span>
                 <span className="opacity-50">|</span>
                 <span className="font-bold">{getRankTitle()}</span>
               </div>
            </div>

            <div className={`flex items-center gap-3 p-1 rounded-2xl transition-all duration-500 ${isTimerRunning ? 'bg-rose-50 border border-rose-100 shadow-inner' : 'bg-gray-50 border border-gray-100'}`}>
              {isTimerRunning && (
                <div className="pl-4 flex flex-col items-start leading-none pr-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-400 mb-0.5">Focusing</span>
                  <span className="font-mono text-xl font-black text-rose-500 tabular-nums tracking-tighter">{formatTime(displaySeconds)}</span>
                </div>
              )}
              <button onClick={toggleTimer} className={`flex items-center justify-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-sm ${isTimerRunning ? 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95' : 'bg-coquette-accent text-white hover:bg-[#ff9eb0] active:scale-95'}`}>
                {isTimerRunning ? <><Square className="w-4 h-4 fill-current" />Stop</> : <><Play className="w-4 h-4 fill-current ml-0.5" />Start</>}
              </button>
            </div>
         </div>
         <div className="w-full h-3 rounded-full overflow-hidden relative z-10 bg-gray-100">
            <motion.div className="h-full bg-gradient-to-r from-coquette-accent to-coquette-gold" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
         </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden h-full">
        <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col overflow-hidden h-full border bg-white border-coquette-border rounded-[25px] shadow-sm">
          <div className="p-4 border-b font-bold tracking-wider text-sm flex items-center gap-2 bg-[#fffbfb] border-coquette-border text-coquette-text font-coquette-body">
             <Book className="w-4 h-4 text-coquette-gold" />
             Table of Contents
          </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-coquette-accent/50">
            <div className="space-y-4">
               {SYLLABUS.map((mod) => {
                 const isExpanded = expandedModules[mod.id];
                 const chapterCount = mod.endChapter - mod.startChapter + 1;
                 const unlockedInMod = unlockedChapters.filter(c => c.startsWith(mod.id)).length;
                 const progressInModPercent = chapterCount > 0 ? (unlockedInMod / chapterCount) * 100 : 0;
                 const selectedInMod = masteredChapters.filter(c => c.startsWith(mod.id)).length;
                 const isFullySelected = selectedInMod === chapterCount && chapterCount > 0;
                 return (
                   <div key={mod.id} className="relative">
                     <div className={`w-full flex flex-col rounded-xl border transition-all duration-300 relative z-10 overflow-hidden ${isExpanded ? 'bg-coquette-bg border-coquette-gold/50 shadow-sm' : 'bg-white border-gray-200 hover:border-coquette-gold/30'}`}>
                        <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleModule(mod.id)}>
                           <div className="flex items-center gap-3">{isExpanded ? <ChevronDown className="w-5 h-5 text-coquette-gold" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}<span className={`font-bold tracking-wide font-coquette-body ${isExpanded ? 'text-coquette-text' : 'text-gray-400'}`}>{mod.title}</span></div>
                           <button onClick={(e) => handleBulkToggle(e, mod)} className="text-gray-500 hover:text-white transition-colors p-1">{isFullySelected ? <CheckSquare className="w-5 h-5 text-coquette-accent" /> : <Square className="w-5 h-5" />}</button>
                        </div>
                        <div className="w-full h-1 bg-gray-200"><div className="h-full transition-all duration-500 bg-coquette-sage" style={{ width: `${progressInModPercent}%` }} /></div>
                     </div>
                     <AnimatePresence>
                       {isExpanded && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 pl-8 border-l ml-6 mt-2 border-coquette-gold/20">
                              {Array.from({ length: chapterCount }, (_, i) => {
                                 const chapterNum = mod.startChapter + i;
                                 const uniqueId = `${mod.id}_${chapterNum}`;
                                 const isSelected = masteredChapters.includes(uniqueId);
                                 const chapterPoints = grammarDatabase[uniqueId] || [];
                                 const hasData = chapterPoints.length > 0;
                                 return (
                                   <div key={uniqueId} className="flex flex-col gap-1">
                                      <div className={`flex items-center justify-between p-2 pl-3 rounded-lg border text-sm transition-all duration-200 group ${isSelected ? 'bg-coquette-accent/10 border-coquette-accent/30 text-coquette-text' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                          <div className="flex items-center gap-2 flex-1 font-coquette-body"><span className={hasData ? "text-coquette-sage font-bold" : ""}>CH {chapterNum}</span>{hasData && <span className="text-[9px] px-1.5 py-0.5 rounded border bg-coquette-sage/10 text-coquette-sage border-coquette-sage/20">{chapterPoints.length} PTS</span>}</div>
                                          <div className="flex items-center gap-1">{hasData && <button onClick={(e) => handleOpenGrammarModal(e, `${mod.title} - Chapter ${chapterNum}`, uniqueId)} className="w-7 h-7 flex items-center justify-center rounded transition-colors text-gray-400 hover:text-coquette-text hover:text-white hover:bg-coquette-bg"><Eye className="w-4 h-4" /></button>}<button onClick={() => toggleChapter(uniqueId)} className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all duration-300 ml-1 ${isSelected ? 'bg-coquette-accent border-coquette-accent text-white shadow-sm' : 'border-gray-300 bg-white hover:border-coquette-accent'}`}><Check className="w-4 h-4" /></button></div>
                                      </div>
                                   </div>
                                 );
                              })}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 );
               })}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex-1 border rounded-2xl p-5 backdrop-blur-sm flex flex-col min-h-[200px] max-h-[300px] bg-white border-coquette-border shadow-sm">
            <div className="flex items-center gap-3 mb-3 border-b pb-3 border-coquette-border text-coquette-text">
              <div className="p-2 rounded-lg bg-coquette-bg"><FileText className="w-5 h-5" /></div>
              <div><h3 className="font-bold tracking-wider font-coquette-header">Notes Import</h3><p className="text-[10px] text-gray-500 font-mono italic">IMPORT ANKI / TEXT DATA</p></div>
            </div>
            <textarea value={localContext} onChange={(e) => setLocalContext(e.target.value)} className="flex-1 border rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-1 resize-none mb-3 custom-scrollbar leading-relaxed bg-[#fffcfc] border-gray-200 text-coquette-text focus:border-coquette-gold focus:ring-coquette-gold placeholder:text-gray-400" placeholder={`Paste your grammar export here...\n\nFormat: Point [TAB] Meaning [TAB] Sentence [TAB] ... [TAB] Tag`} />
            <button onClick={handleSaveContext} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 font-coquette-body ${isSaved ? 'bg-coquette-sage/20 text-coquette-sage border-coquette-sage/50' : 'bg-coquette-bg text-coquette-gold border border-coquette-gold/30 hover:bg-coquette-gold/10'}`}>{isSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}{isSaved ? `SAVED: ${importCount} NODES` : 'Save to Journal'}</button>
          </div>

          <div className="flex-[2] border rounded-[30px] p-6 flex flex-col relative overflow-hidden bg-white border-coquette-border shadow-lg">
             <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-50 relative z-10">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-rose-50 rounded-lg text-rose-400"><Sparkles className="w-4 h-4" /></div>
                   <h3 className="text-xl font-bold font-coquette-header text-gray-800">Practice Session</h3>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button onClick={() => setIsJLPTMode(true)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isJLPTMode ? 'bg-rose-400 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Exam</button>
                    <button onClick={() => setIsJLPTMode(false)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isJLPTMode ? 'bg-indigo-400 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Deep</button>
                </div>
             </div>

             {/* MODE SELECTOR */}
             <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border bg-gray-50 border-gray-200 mb-4 relative z-10">
               {(['GRAMMAR', 'READING', 'VOCAB'] as ExamMode[]).map((mode) => (
                 <button key={mode} onClick={() => setExamMode(mode)} className={`text-[10px] font-black py-2 rounded-lg transition-all ${examMode === mode ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}>{mode}</button>
               ))}
             </div>

             {/* GRANULAR TOPIC SELECTION */}
             <div className="flex-1 overflow-hidden flex flex-col relative z-10">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-1"><ListChecks className="w-3 h-3" /> Target Sub-points</p>
                   {availablePoints.length > 0 && (
                     <button onClick={toggleAllSubPoints} className="text-[10px] font-bold text-rose-400 hover:underline">
                       {selectedSubPoints.size === availablePoints.length ? 'Clear All' : 'Select All'}
                     </button>
                   )}
                </div>
                <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-200">
                   {selectedCount === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-40">
                        <Zap className="w-8 h-8 mb-2" />
                        <p className="text-xs italic font-coquette-body">Select chapters from the list to reveal specific grammar points for drilling.</p>
                     </div>
                   ) : (
                     <div className="space-y-2">
                        {availablePoints.map((point) => (
                          <button 
                            key={point.id}
                            onClick={() => toggleSubPoint(point.point)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedSubPoints.has(point.point) ? 'bg-white border-rose-200 shadow-sm text-rose-700' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/60'}`}
                          >
                            <span className="text-sm font-bold truncate pr-4">{point.point}</span>
                            {selectedSubPoints.has(point.point) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-20" />}
                          </button>
                        ))}
                     </div>
                   )}
                </div>
             </div>
             
             <button onClick={handleSimulate} disabled={selectedCount === 0} className={`mt-4 w-full py-4 rounded-2xl font-black tracking-[0.2em] text-sm relative overflow-hidden transition-all transform active:scale-95 z-10 font-coquette-body ${selectedCount > 0 ? 'bg-coquette-text text-white shadow-xl hover:shadow-rose-100' : 'bg-gray-100 text-gray-300 border border-gray-200'}`}>
               <span className="relative z-10 flex items-center justify-center gap-3"><Zap className="w-4 h-4" /> ENGAGE DRILL</span>
             </button>
          </div>
        </motion.div>
      </div>

      <SimulationModal 
        isOpen={isSimulationOpen} 
        onClose={() => setIsSimulationOpen(false)}
        mode={examMode}
        isJLPTMode={isJLPTMode}
        specificPoints={Array.from(selectedSubPoints)}
      />

      <GrammarListModal 
        isOpen={modalData.isOpen}
        onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
        title={modalData.title}
        points={modalData.points}
      />
    </motion.div>
  );
};

export default SyntaxArchive;
