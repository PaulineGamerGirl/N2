import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '../constants';
import { CAMPAIGN_PHASES, MOCK_CURRENT_DATE } from '../data/campaign';
import { Feather, Key, Heart } from 'lucide-react';
// Fix: remove parseISO from imports
import { isAfter, isBefore, isWithinInterval } from 'date-fns';

const QuestMap: React.FC = () => {
  const activeCardRef = useRef<HTMLDivElement>(null);

  // Use Mock Date for visual simulation
  const now = MOCK_CURRENT_DATE;

  // Auto-scroll to active phase on mount
  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      });
    }
  }, []);

  return (
    <motion.div 
      className="w-full h-full p-8 overflow-hidden flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-3xl font-bold mb-8 flex items-center font-coquette-header text-coquette-text">
        <span className="flex items-center gap-2">
            <Feather className="w-8 h-8 text-coquette-gold" /> My Journey Roadmap
        </span>
      </h2>

      <div 
        className="flex-1 flex items-center space-x-8 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory px-4"
      >
        {CAMPAIGN_PHASES.map((phase, index) => {
          // Fix: use new Date() instead of parseISO
          const startDate = new Date(phase.startDate);
          const endDate = new Date(phase.endDate);

          const isCleared = isAfter(now, endDate);
          const isActive = isWithinInterval(now, { start: startDate, end: endDate });
          const isLocked = isBefore(now, startDate);

          // Card Styles based on Theme
          let cardClasses = `bg-white border-2 rounded-[30px] shadow-lg transition-all duration-500 `;
          if (isCleared) cardClasses += 'border-coquette-sage/50 opacity-80';
          if (isActive) cardClasses += 'border-coquette-accent shadow-[0_0_30px_rgba(244,172,183,0.3)] scale-105 z-10';
          if (isLocked) cardClasses += 'bg-gray-50 border-gray-200 text-gray-400';

          return (
            <motion.div
              key={phase.id}
              ref={isActive ? activeCardRef : null}
              className={`snap-center flex-shrink-0 w-[350px] h-[450px] relative group ${cardClasses}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Active Glow/Decor Effect */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none bg-gradient-to-br from-coquette-accent/5 to-transparent" />
              )}
              
              {/* Connector Line */}
              {index !== CAMPAIGN_PHASES.length - 1 && (
                <div className={`absolute top-1/2 -right-12 w-12 h-1 z-0
                  ${isCleared ? 'bg-coquette-sage border-b-2 border-dotted border-white' : 'bg-gray-200 border-b-2 border-dotted border-gray-300'}
                `} />
              )}

              <div className="relative p-8 h-full flex flex-col justify-between z-10">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-5xl font-bold opacity-10 font-coquette-header text-coquette-gold">
                      0{phase.id}
                    </span>
                    
                    {/* Status Icons */}
                    {isCleared && (
                       <Heart className="text-coquette-sage w-8 h-8 fill-coquette-sage/20" /> 
                    )}
                    {isActive && (
                       <Feather className="text-coquette-accent w-8 h-8 animate-pulse" /> 
                    )}
                    {isLocked && (
                       <Key className="text-gray-300 w-8 h-8" /> 
                    )}
                  </div>

                  <div className="mb-2 flex items-center space-x-2 text-xs font-mono text-coquette-subtext">
                    <span>{phase.startDate} — {phase.endDate}</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 font-coquette-header text-coquette-text">
                    {phase.title}
                  </h3>
                  <p className="text-sm font-semibold tracking-wide uppercase mb-6 text-coquette-accent font-coquette-body">
                    {phase.subtitle}
                  </p>
                  <p className="text-sm leading-relaxed text-coquette-text/80 font-coquette-body">
                    {phase.description}
                  </p>
                </div>

                <div className="mt-4">
                   {isActive && (
                     <div className="w-full py-2 text-sm tracking-widest font-bold text-center rounded bg-coquette-accent/10 text-coquette-accent border border-coquette-accent/30 font-coquette-body">
                       Currently Writing...
                     </div>
                   )}
                   {isCleared && (
                     <div className="text-sm flex items-center font-bold tracking-wider text-coquette-sage font-coquette-body">
                        Chapter Completed
                     </div>
                   )}
                   {isLocked && (
                      <div className="text-sm flex items-center font-mono text-gray-400 font-coquette-body italic">
                        Not Yet Revealed
                      </div>
                   )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuestMap;