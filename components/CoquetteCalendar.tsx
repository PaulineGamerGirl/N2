import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, endOfMonth, endOfWeek, 
  eachDayOfInterval, addMonths, isSameMonth, 
  isSameDay, isToday, getDate 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Heart, Star, Sparkles, X, Check } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';

// Mock Syllabus Data Generator
const getTasksForDate = (date: Date) => {
  const day = getDate(date);
  // Deterministic task generation based on day of month
  return [
    { id: 't1', type: 'vocab' as const, label: `Daily Vocab Drill (${10 + (day % 5)} words)`, value: 10 + (day % 5) },
    { id: 't2', type: 'grammar' as const, label: day % 2 === 0 ? 'Grammar: Conjugation Review' : 'Grammar: Particle Practice', value: 1 },
    { id: 't3', type: 'immersion' as const, label: 'Immersion: Reading (15m)', value: 15 },
    { id: 't4', type: 'vocab' as const, label: 'Wanikani Review', value: 5 },
  ];
};

const CoquetteCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { dailyChecklist, toggleDailyTask } = useProgressStore();

  // Replacements for missing date-fns exports
  // startOfMonth replacement
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = endOfMonth(monthStart);
  
  // startOfWeek replacement (Defaults to Sunday start)
  const startDate = new Date(monthStart);
  startDate.setDate(monthStart.getDate() - monthStart.getDay());
  
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // subMonths replacement using addMonths with negative value
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const tasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Calculate completion for the selected day
  const completedCount = tasks.filter(t => dailyChecklist[`${dateKey}-${t.id}`]).length;
  const totalTasks = tasks.length;
  const isAllDone = totalTasks > 0 && completedCount === totalTasks;

  return (
    <div className="w-full h-full flex flex-col gap-6">
      
      {/* Calendar Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-4 border-double border-coquette-gold/30 rounded-[30px] p-6 shadow-[0_10px_40px_rgba(244,172,183,0.15)] relative overflow-hidden"
      >
        {/* Decorative Corner Flowers */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-pink-100 to-transparent rounded-br-[40px] opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-coquette-gold/10 to-transparent rounded-tl-[50px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-4">
           <button onClick={prevMonth} className="p-2 rounded-full hover:bg-coquette-bg text-coquette-text transition-colors">
             <ChevronLeft className="w-6 h-6" />
           </button>
           <h2 className="text-3xl font-coquette-header text-coquette-text text-center min-w-[200px]">
             {format(currentDate, 'MMMM yyyy')}
           </h2>
           <button onClick={nextMonth} className="p-2 rounded-full hover:bg-coquette-bg text-coquette-text transition-colors">
             <ChevronRight className="w-6 h-6" />
           </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center font-coquette-body text-coquette-subtext text-sm uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 lg:gap-4">
          {calendarDays.map((day, idx) => {
             const isCurrentMonth = isSameMonth(day, monthStart);
             const isTodayDate = isToday(day);
             const isSelected = selectedDate && isSameDay(day, selectedDate);
             
             // Check if tasks are done for this day (visual indicator)
             const dayKey = format(day, 'yyyy-MM-dd');
             const dayTasks = getTasksForDate(day);
             const dayCompleted = dayTasks.every(t => dailyChecklist[`${dayKey}-${t.id}`]);
             
             return (
               <motion.button
                 key={day.toString()}
                 onClick={() => handleDateClick(day)}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className={`
                    relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 border transition-all duration-300
                    ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                    ${isSelected 
                       ? 'bg-coquette-accent/20 border-coquette-accent text-coquette-text shadow-md ring-2 ring-coquette-accent/30' 
                       : 'bg-coquette-bg/30 border-transparent hover:border-coquette-gold/30 hover:bg-white'}
                    ${isTodayDate && !isSelected ? 'border-coquette-gold border-dashed bg-white' : ''}
                 `}
               >
                 <span className={`text-lg font-coquette-body ${isTodayDate ? 'font-bold text-coquette-gold' : 'text-coquette-text'}`}>
                   {format(day, 'd')}
                 </span>
                 
                 {/* Visual Indicators */}
                 <div className="absolute bottom-2 flex gap-1">
                    {dayCompleted && (
                       <Heart className="w-3 h-3 text-coquette-accent fill-coquette-accent" />
                    )}
                 </div>
               </motion.button>
             );
          })}
        </div>
      </motion.div>

      {/* Task Checklist Modal / Expanded View */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-2 border-coquette-border rounded-[25px] p-6 shadow-lg overflow-hidden"
          >
             <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div>
                   <h3 className="text-xl font-coquette-header text-coquette-text">
                     Checklist: {format(selectedDate, 'MMMM do')}
                   </h3>
                   <p className="text-sm text-coquette-subtext font-coquette-body italic">
                     {isAllDone ? "All tasks completed! Wonderful work." : "Little steps lead to big dreams."}
                   </p>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="space-y-3">
                {tasks.map((task) => {
                   const isChecked = !!dailyChecklist[`${dateKey}-${task.id}`];
                   
                   return (
                     <motion.div 
                       key={task.id}
                       initial={{ x: -20, opacity: 0 }}
                       animate={{ x: 0, opacity: 1 }}
                       className={`
                         flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer group
                         ${isChecked 
                           ? 'bg-coquette-bg border-coquette-accent/30' 
                           : 'bg-white border-gray-100 hover:border-coquette-gold/30 hover:shadow-sm'}
                       `}
                       onClick={() => toggleDailyTask(dateKey, task.id, task.type, task.value)}
                     >
                        <div className="flex items-center gap-4">
                           <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500
                              ${isChecked 
                                ? 'bg-coquette-accent border-coquette-accent' 
                                : 'bg-white border-gray-300 group-hover:border-coquette-accent'}
                           `}>
                              {isChecked ? (
                                <Heart className="w-4 h-4 text-white fill-white" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gray-100 group-hover:bg-coquette-accent/20 transition-colors" />
                              )}
                           </div>
                           
                           <div>
                              <div className={`font-coquette-body text-lg ${isChecked ? 'text-coquette-text line-through opacity-60' : 'text-gray-700'}`}>
                                {task.label}
                              </div>
                              <div className="text-xs text-coquette-subtext uppercase tracking-wider font-bold">
                                +{task.value} {task.type === 'immersion' ? 'Mins' : (task.type === 'grammar' ? 'Pts' : 'XP')}
                              </div>
                           </div>
                        </div>

                        {isChecked && (
                           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Sparkles className="w-5 h-5 text-coquette-gold" />
                           </motion.div>
                        )}
                     </motion.div>
                   );
                })}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CoquetteCalendar;