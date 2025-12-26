
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DialogueLine } from '../../types';
import { TokenType } from '../../types/immersionSchema';

interface SubtitleOverlayProps {
  line: DialogueLine;
  activeGroupId: number | null;
  onTokenClick: (groupId: number) => void;
}

const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ line, activeGroupId, onTokenClick }) => {
  return (
    <div className="absolute bottom-12 left-0 right-0 z-10 flex flex-col items-center gap-2 px-12 pointer-events-none">
      
      {/* English Translation Overlay (TOP LAYER) */}
      <div className="h-10 flex items-center justify-center">
        <AnimatePresence>
          {activeGroupId !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap justify-center gap-1.5"
            >
              {line.english.map((token, idx) => {
                const isActive = activeGroupId === token.groupId && token.groupId !== 0;
                return (
                  <span
                    key={idx}
                    className={`
                      text-base md:text-lg font-coquette-rounded font-semibold tracking-wide transition-all duration-300
                      ${isActive ? 'text-emerald-400 font-bold scale-110' : 'text-white/70'}
                    `}
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,1)' }}
                  >
                    {token.text}
                  </span>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Japanese Dialogue Overlay (STABLE BOTTOM LAYER) */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {line.japanese.map((token, idx) => {
          const isActive = activeGroupId === token.groupId && token.groupId !== 0;
          return (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (token.groupId !== 0) onTokenClick(token.groupId);
              }}
              className={`
                text-lg md:text-2xl font-bold tracking-wider transition-all duration-300 pointer-events-auto cursor-pointer
                ${isActive ? 'text-emerald-400 scale-105' : 'text-white hover:text-rose-300'}
              `}
              style={{ 
                textShadow: '0 4px 12px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.5)',
                filter: isActive ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))' : 'none'
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default SubtitleOverlay;
