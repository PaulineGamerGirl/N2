import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, endOfMonth, endOfWeek, 
  eachDayOfInterval, addMonths, isSameMonth, 
  isSameDay, isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Heart, CalendarRange } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { MOCK_CURRENT_DATE } from '../data/campaign';

interface CompactCalendarWidgetProps {
  onOpenYearlyView: () => void;
}

const CompactCalendarWidget: React.FC<CompactCalendarWidgetProps> = ({ onOpenYearlyView }) => {
  // Default to MOCK_CURRENT_DATE (Dec 2025) as requested
  const [currentDate, setCurrentDate] = useState(MOCK_CURRENT_DATE);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const { completedDates, toggleDate } = useProgressStore();

  // Date Logic
  // Manual implementation for startOfMonth
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = endOfMonth(monthStart);
  
  // Manual implementation for startOfWeek (Sunday start)
  const startDate = new Date(monthStart);
  startDate.setDate(monthStart.getDate() - monthStart.getDay());
  
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Navigation Handlers
  const prevMonth = () => {
    setDirection(-1);
    setCurrentDate(addMonths(currentDate, -1));
  };

  const nextMonth = () => {
    setDirection(1);
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    toggleDate(dateStr);
  };

  // 3D Page Flip Variants
  const variants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 90 : -90,
      opacity: 0,
      x: dir > 0 ? 20 : -20,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -90 : 90,
      opacity: 0,
      x: dir > 0 ? -20 : 20,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    })
  };

  return (
    <div className="bg-[#fffcfc] border border-coquette-border rounded-[30px] overflow-hidden shadow-[0_4px_20px_rgba(244,172,183,0.15)] h-full flex flex-col perspective-1000">
      {/* Header */}
      <div className="bg-pink-50/50 p-4 flex items-center justify-between border-b border-coquette-border/30 backdrop-blur-sm z-10 relative">
        <button onClick={prevMonth} className="p-1 rounded-full text-coquette-subtext hover:bg-white hover:text-coquette-text transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center">
            <h3 className="font-coquette-header text-xl text-coquette-text">
            {format(currentDate, 'MMMM yyyy')}
            </h3>
            <button 
                onClick={onOpenYearlyView}
                className="flex items-center gap-1 text-[10px] text-coquette-subtext hover:text-coquette-accent transition-colors uppercase tracking-widest font-bold mt-1"
            >
                <CalendarRange className="w-3 h-3" /> View Journey
            </button>
        </div>

        <button onClick={nextMonth} className="p-1 rounded-full text-coquette-subtext hover:bg-white hover:text-coquette-text transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Body Container with Perspective */}
      <div className="p-5 flex-1 flex flex-col relative overflow-hidden bg-white" style={{ perspective: '1000px' }}>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2 z-10 relative">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-xs font-bold text-coquette-subtext uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Animated Grid */}
        <AnimatePresence initial={false} custom={direction} mode='wait'>
          <motion.div
            key={currentDate.toISOString()} // Trigger animation on date change
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr w-full h-full transform-style-3d origin-center"
          >
            {calendarDays.map((day, idx) => {
               const isCurrentMonth = isSameMonth(day, monthStart);
               const isTodayDate = isSameDay(day, MOCK_CURRENT_DATE); // Use Mock Date for "Today" visual
               const dateStr = format(day, 'yyyy-MM-dd');
               const isChecked = !!completedDates[dateStr];
               
               return (
                 <motion.button
                   key={day.toString()}
                   onClick={() => handleDayClick(day)}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.9 }}
                   className={`
                      relative aspect-square rounded-xl flex items-center justify-center text-sm font-coquette-body transition-all duration-300
                      ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                      ${isTodayDate && !isChecked
                         ? 'border-2 border-coquette-accent text-coquette-accent bg-white cursor-pointer shadow-sm' 
                         : ''}
                      ${isChecked 
                         ? 'bg-coquette-accent text-white shadow-md rotate-0' 
                         : 'hover:bg-pink-50'}
                      ${!isTodayDate && !isChecked ? 'text-gray-500' : ''}
                   `}
                 >
                   {isChecked ? (
                     <motion.div 
                       initial={{ scale: 0, rotate: 180 }} 
                       animate={{ scale: 1, rotate: 0 }}
                       transition={{ type: "spring", stiffness: 260, damping: 20 }}
                     >
                       <Heart className="w-4 h-4 fill-white text-white" />
                     </motion.div>
                   ) : (
                     <span>{format(day, 'd')}</span>
                   )}
                 </motion.button>
               );
            })}
          </motion.div>
        </AnimatePresence>
        
        {/* Footer Note */}
        <div className="mt-4 text-center z-10 relative">
            <p className="text-[10px] text-coquette-subtext font-coquette-body italic">
                {Object.keys(completedDates).length > 0 
                  ? `${Object.keys(completedDates).length} days cherished.` 
                  : "Every day is a new beginning."}
            </p>
        </div>
      </div>
    </div>
  );
};

export default CompactCalendarWidget;