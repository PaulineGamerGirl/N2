
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, BookOpen, Tv, Database, Activity, Sparkles, Clock, 
  Heart, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, X, BarChart3, Info, Check, Play, Square, Timer
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { ActivityLogEntry, ActivityCategory } from '../types';
import { 
  format, addHours, endOfMonth, 
  eachDayOfInterval, isSameMonth, isSameDay, 
  endOfWeek, addMonths
} from 'date-fns';
import { containerVariants, itemVariants } from '../constants';

// --- GLOBAL HELPERS ---
export const getVirtualDateString = (timestamp: number): string => {
  return format(addHours(new Date(timestamp), -6), 'yyyy-MM-dd');
};

const OrbitRing: React.FC<{ 
  value: number; 
  target: number; 
  color: string; 
  label: string; 
  icon: React.ReactNode 
}> = ({ value, target, color, label, icon }) => {
  const percentage = Math.min(100, (value / target) * 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24 lg:w-28 lg:h-28 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
          <motion.circle
            cx="50" cy="50" r={radius} stroke={color} strokeWidth="6" fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 scale-75 lg:scale-100">
          {icon}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm lg:text-base font-bold font-coquette-header text-coquette-text">{value}m</div>
        <div className="text-[9px] uppercase tracking-widest text-coquette-subtext font-bold">{label}</div>
      </div>
    </div>
  );
};

const ActivityLogTab: React.FC = () => {
  const { activityLogs, addActivityLog } = useProgressStore();

  // --- STATE ---
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Fix: use new Date constructor to get start of current month as startOfMonth is missing
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  
  // --- PERSISTENT ANKI TIMER STATE ---
  const [isAnkiTimerRunning, setIsAnkiTimerRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    const updateTimerDisplay = () => {
      const startTime = localStorage.getItem('anki_session_start');
      if (startTime) {
        setIsAnkiTimerRunning(true);
        const duration = Math.floor((Date.now() - Number(startTime)) / 1000);
        setDisplaySeconds(Math.max(0, duration));
      } else {
        setIsAnkiTimerRunning(false);
        setDisplaySeconds(0);
      }
    };

    updateTimerDisplay();
    const interval = setInterval(updateTimerDisplay, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleAnkiTimer = () => {
    if (isAnkiTimerRunning) {
      // Stop
      const startTime = Number(localStorage.getItem('anki_session_start'));
      const sessionSeconds = Math.floor((Date.now() - startTime) / 1000);
      
      if (sessionSeconds >= 60) {
        addActivityLog({
          timestamp: Date.now(),
          category: 'ANKI',
          durationMinutes: Math.floor(sessionSeconds / 60),
          summary: 'Anki Review Session (Timer)'
        });
      }
      
      const total = Number(localStorage.getItem('anki_total_time') || 0);
      localStorage.setItem('anki_total_time', (total + sessionSeconds).toString());
      localStorage.removeItem('anki_session_start');
      window.dispatchEvent(new Event('storage-update'));
      setIsAnkiTimerRunning(false);
      setDisplaySeconds(0);
    } else {
      // Start
      localStorage.setItem('anki_session_start', Date.now().toString());
      setIsAnkiTimerRunning(true);
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Form State
  const [newCategory, setNewCategory] = useState<ActivityCategory>('ANKI');
  const [newDuration, setNewDuration] = useState('30');
  const [newSummary, setNewSummary] = useState('');

  const selectedVirtualStr = getVirtualDateString(viewDate.getTime());

  const todaysLogs = useMemo(() => {
    return activityLogs
      .filter(log => getVirtualDateString(log.timestamp) === selectedVirtualStr)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [activityLogs, selectedVirtualStr]);

  const stats = useMemo(() => {
    const totals = { OUTPUT: 0, LOGIC: 0, IMMERSION: 0 };
    todaysLogs.forEach(log => {
      if (log.category === 'OUTPUT') totals.OUTPUT += log.durationMinutes;
      else if (log.category === 'IMMERSION') totals.IMMERSION += log.durationMinutes;
      else totals.LOGIC += log.durationMinutes;
    });
    return totals;
  }, [todaysLogs]);

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      // Fix: replace subDays with native Date operations
      const d = new Date(viewDate);
      d.setDate(d.getDate() - (6 - i));
      const dStr = getVirtualDateString(d.getTime());
      const dayLogs = activityLogs.filter(log => getVirtualDateString(log.timestamp) === dStr);
      const totalMins = dayLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      return {
        label: format(d, 'EEE'),
        fullDate: d,
        minutes: totalMins,
        isTargetMet: totalMins >= 60
      };
    });
  }, [activityLogs, viewDate]);

  const maxWeeklyMins = Math.max(...weeklyData.map(d => d.minutes), 60);

  const calendarDays = useMemo(() => {
    // Fix: replace startOfMonth and startOfWeek with native Date operations to handle missing date-fns exports
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const start = new Date(monthStart);
    start.setDate(monthStart.getDate() - monthStart.getDay());
    const end = endOfWeek(endOfMonth(calendarMonth));
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const daysWithData = useMemo(() => {
    const set = new Set();
    activityLogs.forEach(log => set.add(getVirtualDateString(log.timestamp)));
    return set;
  }, [activityLogs]);

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    addActivityLog({
      timestamp: Date.now(),
      category: newCategory,
      durationMinutes: parseInt(newDuration),
      summary: newSummary || `Manual ${newCategory.toLowerCase()} entry`
    });
    setIsModalOpen(false);
    setNewSummary('');
  };

  const CATEGORY_ICONS: Record<ActivityCategory, React.ReactNode> = {
    OUTPUT: <Mic className="w-5 h-5" />,
    GRAMMAR: <BookOpen className="w-5 h-5" />,
    ANKI: <Database className="w-5 h-5" />,
    IMMERSION: <Tv className="w-5 h-5" />
  };

  return (
    <motion.div 
      className="p-4 lg:p-8 w-full max-w-7xl mx-auto h-full flex flex-col gap-6 overflow-hidden"
      variants={containerVariants} initial="hidden" animate="visible"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
        
        {/* LEFT COLUMN - Side Sidebar with Scrolling */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar h-full pb-8">
          
          {/* REFINED ANKI TIMER WIDGET */}
          <motion.div 
            variants={itemVariants} 
            className="bg-white border border-coquette-border rounded-[25px] p-2 shadow-sm overflow-hidden"
          >
             <div className="flex items-center">
                {/* Timer Info Side */}
                <div className="flex-1 pl-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                       <Database className="w-3.5 h-3.5 text-coquette-gold" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-coquette-subtext">Anki Focus</span>
                    </div>
                    <div className="text-3xl font-black font-mono text-coquette-text tabular-nums tracking-tighter">
                      {formatTime(displaySeconds)}
                    </div>
                </div>

                {/* Action Button - Reconfigured to be longer and less rounded */}
                <button
                  onClick={toggleAnkiTimer}
                  className={`
                    w-32 h-14 rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-300 mr-1
                    ${isAnkiTimerRunning 
                      ? 'bg-rose-50 text-rose-500 border border-rose-100 shadow-inner' 
                      : 'bg-coquette-accent text-white shadow-md hover:scale-[1.02] active:scale-[0.98]'}
                  `}
                >
                  <div className="relative">
                    {isAnkiTimerRunning ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                    {isAnkiTimerRunning ? 'Stop' : 'Start'}
                  </span>
                </button>
             </div>
          </motion.div>

          {/* MINI CALENDAR */}
          <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[30px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-coquette-header text-coquette-text font-bold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-coquette-gold" /> Almanac
              </h3>
              <div className="flex gap-1">
                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))} className="p-1 hover:bg-rose-50 rounded text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-1 hover:bg-rose-50 rounded text-gray-400"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="text-center text-xs font-bold text-coquette-subtext mb-2 uppercase tracking-widest">{format(calendarMonth, 'MMMM yyyy')}</div>
            <div className="grid grid-cols-7 gap-1">
              {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] text-center text-gray-300 font-bold p-1">{d}</div>)}
              {calendarDays.map(day => {
                const isSelected = isSameDay(day, viewDate);
                const hasData = daysWithData.has(format(day, 'yyyy-MM-dd'));
                const isCurrentMonth = isSameMonth(day, calendarMonth);
                return (
                  <button key={day.toString()} onClick={() => setViewDate(day)} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-all ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'} ${isSelected ? 'bg-coquette-accent text-white shadow-md' : 'hover:bg-rose-50 text-gray-600'}`}>
                    {format(day, 'd')}
                    {hasData && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-coquette-gold'}`} />}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* WEEKLY WAVE CHART */}
          <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[30px] p-6 shadow-sm">
            <h3 className="font-coquette-header text-coquette-text font-bold mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-rose-400" /> Weekly Wave</h3>
            <div className="flex items-end justify-between h-32 gap-2 px-2">
              {weeklyData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className={`w-full rounded-t-lg transition-all duration-500 relative ${day.isTargetMet ? 'bg-gradient-to-t from-coquette-accent to-pink-300' : 'bg-gray-100'} ${isSameDay(day.fullDate, viewDate) ? 'ring-2 ring-coquette-gold ring-offset-2' : ''}`} style={{ height: `${(day.minutes / maxWeeklyMins) * 100}%`, minHeight: '4px' }}>
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{day.minutes} mins</div>
                  </div>
                  <span className={`text-[10px] font-bold ${isSameDay(day.fullDate, viewDate) ? 'text-coquette-accent' : 'text-gray-400'}`}>{day.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <button onClick={() => setIsModalOpen(true)} className="w-full py-4 rounded-[20px] bg-white border border-coquette-accent text-coquette-accent font-bold font-coquette-body flex items-center justify-center gap-2 hover:bg-rose-50 transition-all"><Plus className="w-5 h-5" /> Manual Entry</button>
        </div>

        {/* RIGHT COLUMN - Main Content and Chronicle */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
          {/* Orbit Stats Card */}
          <motion.div variants={itemVariants} className="bg-white border border-coquette-border rounded-[40px] p-8 shadow-sm relative overflow-hidden flex-shrink-0">
             <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <h2 className="text-2xl font-bold font-coquette-header text-coquette-text mb-1">{isSameDay(viewDate, new Date()) ? "Today's Orbit" : format(viewDate, 'MMMM do')}</h2>
                  <p className="text-xs text-coquette-subtext font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Virtual Day Reset 6:00 AM</p>
                </div>
                <div className="flex gap-6 lg:gap-10">
                  <OrbitRing value={stats.OUTPUT} target={30} color="#f4acb7" label="Output" icon={<Mic className="w-5 h-5 text-rose-400" />} />
                  <OrbitRing value={stats.LOGIC} target={45} color="#a5b4fc" label="Logic" icon={<Database className="w-5 h-5 text-indigo-400" />} />
                  <OrbitRing value={stats.IMMERSION} target={60} color="#ccd5ae" label="Immersion" icon={<Tv className="w-5 h-5 text-emerald-400" />} />
                </div>
             </div>
          </motion.div>

          {/* Chronicle Card - Independent Scrolling List */}
          <motion.div variants={itemVariants} className="flex-1 flex flex-col bg-[#fffcfc] border border-coquette-border rounded-[30px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-coquette-border flex items-center justify-between bg-white sticky top-0 z-10">
               <h2 className="text-xl font-bold font-coquette-header text-coquette-text flex items-center gap-2"><Clock className="w-5 h-5 text-coquette-gold" /> The Chronicle</h2>
               {todaysLogs.length > 0 && <span className="text-[10px] font-bold uppercase tracking-widest text-coquette-accent bg-rose-50 px-3 py-1 rounded-full">{todaysLogs.length} Sessions</span>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
              {todaysLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-coquette-accent flex items-center justify-center"><Sparkles className="text-coquette-accent animate-pulse" /></div>
                  <p className="text-lg font-coquette-header text-coquette-text italic">"The blank page is a garden waiting to be planted."</p>
                </div>
              ) : (
                <div className="space-y-10 relative pb-4">
                  <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-rose-100" />
                  {todaysLogs.map((log, index) => (
                    <motion.div key={log.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} className="flex gap-6 relative">
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${log.category === 'OUTPUT' ? 'bg-rose-50 text-rose-400' : log.category === 'IMMERSION' ? 'bg-emerald-50 text-emerald-400' : 'bg-indigo-50 text-indigo-400'}`}>{CATEGORY_ICONS[log.category]}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5"><span className="text-[10px] font-bold text-coquette-subtext uppercase tracking-widest">{format(new Date(log.timestamp), 'h:mm a')}</span><span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-400 font-bold">{log.category}</span></div>
                        <h3 className="text-base font-bold font-coquette-header text-coquette-text">Spent {log.durationMinutes}m on {log.category.toLowerCase()}.</h3>
                        <p className="text-xs text-gray-500 font-coquette-body italic mt-1 leading-relaxed">{log.summary}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* MANUAL ENTRY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-rose-900/10 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden border border-coquette-border">
              <div className="p-8 border-b border-rose-50 bg-rose-50/20 flex justify-between items-center">
                 <div className="flex items-center gap-3"><div className="p-3 bg-white rounded-2xl shadow-sm text-coquette-accent"><Plus className="w-5 h-5" /></div><h2 className="text-2xl font-bold font-coquette-header text-coquette-text">Scribe's Entry</h2></div>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-500"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveManualLog} className="p-8 space-y-6">
                 <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-coquette-subtext">Session Category</label><div className="grid grid-cols-3 gap-2">{(['ANKI', 'IMMERSION', 'GRAMMAR'] as ActivityCategory[]).map(cat => (<button key={cat} type="button" onClick={() => setNewCategory(cat)} className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${newCategory === cat ? 'bg-coquette-accent border-coquette-accent text-white' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-rose-50'}`}>{cat}</button>))}</div></div>
                 <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-coquette-subtext">Duration (Minutes)</label><input type="number" required value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none font-bold text-coquette-text transition-all" /></div>
                 <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-coquette-subtext">Summary / Note</label><textarea value={newSummary} onChange={e => setNewSummary(e.target.value)} placeholder="e.g. Core 6k Review" className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none resize-none h-24 text-sm font-coquette-body italic transition-all" /></div>
                 <button type="submit" className="w-full py-4 rounded-[20px] bg-coquette-text text-white font-bold font-coquette-header shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save Record</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActivityLogTab;
