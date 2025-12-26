
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DialogueLine } from '../../types';
import { ImmersionToken, TokenType } from '../../types/immersionSchema';
import { ScrollText, Navigation2 } from 'lucide-react';

interface TranscriptStreamProps {
  nodes?: (DialogueLine | any)[];
  activeNodeId: string | null;
  onSeek: (timestamp: number) => void;
  isTranslationVisible: boolean;
}

const TokenChip: React.FC<{ 
  token: ImmersionToken; 
  isEnglish?: boolean;
  isActive: boolean;
  onTokenClick: (groupId: number) => void;
}> = ({ token, isEnglish = false, isActive, onTokenClick }) => {
  const isPunctuation = token.type === TokenType.PUNCTUATION;
  const isGrammar = token.type === TokenType.GRAMMAR;
  const canHighlight = token.groupId > 0; // Fixed: strictly check for positive IDs

  return (
    <motion.span 
      onClick={(e) => {
        e.stopPropagation();
        if (canHighlight) onTokenClick(token.groupId);
      }}
      className={`
        inline-flex px-0.5 py-0.5 rounded-md transition-all duration-300 cursor-pointer
        ${isActive ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 shadow-sm z-10 scale-105' : ''}
        ${!isActive && isPunctuation ? 'text-gray-300' : ''}
        ${!canHighlight ? 'cursor-default' : 'hover:bg-rose-50/50'}
      `}
    >
      <span className={`
        font-coquette-rounded leading-tight select-none
        ${isEnglish ? 'text-[10px] md:text-[11px]' : 'text-sm md:text-base'}
        ${!isActive && isGrammar ? 'text-rose-400 font-medium' : ''}
        ${!isActive && !isGrammar && !isPunctuation ? (isEnglish ? 'text-gray-500 font-medium' : 'font-bold text-coquette-text') : ''}
        ${isActive ? 'font-bold' : ''}
      `}>
        {token.text}
      </span>
    </motion.span>
  );
};

const TranscriptLine: React.FC<{ 
  line: DialogueLine;
  isActive: boolean;
  isTranslationVisible: boolean;
  onSeek: (timestamp: number) => void;
  activeGroupId: number | null;
  onTokenClick: (groupId: number) => void;
}> = ({ line, isActive, isTranslationVisible, onSeek, activeGroupId, onTokenClick }) => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && lineRef.current) {
      lineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  const shouldRevealTranslation = isTranslationVisible || (activeGroupId !== null);

  const handleTokenInteraction = (groupId: number) => {
    if (!isActive) onSeek(line.timestampStart);
    onTokenClick(groupId);
  };

  return (
    <div 
      ref={lineRef}
      className={`mb-3 flex gap-2.5 transition-all duration-500 ${isActive ? 'scale-[1.01]' : 'opacity-70'}`}
    >
      <div className="flex flex-col items-center pt-1.5">
        <button
          onClick={() => onSeek(line.timestampStart)}
          className={`
            w-1 flex-1 rounded-full transition-all duration-300 group relative
            ${isActive ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,172,183,0.6)]' : 'bg-rose-100/80 hover:bg-rose-300'}
          `}
        >
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Navigation2 className="w-2 h-2 text-rose-400 fill-current" />
          </div>
        </button>
      </div>

      <motion.div
        animate={{ 
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.3)',
          borderColor: isActive ? '#fde2e4' : 'transparent',
          boxShadow: isActive ? '0 10px 25px -5px rgba(244, 172, 183, 0.12)' : 'none'
        }}
        className="flex-1 text-left py-2.5 px-4 rounded-[20px] border-2 transition-shadow overflow-hidden"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-end gap-x-0.5">
            {line.japanese.map((t, i) => (
              <TokenChip 
                key={i} 
                token={t} 
                isActive={activeGroupId === t.groupId && t.groupId > 0}
                onTokenClick={handleTokenInteraction}
              />
            ))}
          </div>

          <AnimatePresence>
            {isActive && shouldRevealTranslation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-x-0.5 border-l-2 border-emerald-100 pl-3 mt-1.5 mb-1 py-0.5">
                  {line.english.map((t, i) => (
                    <TokenChip 
                      key={i} 
                      token={t} 
                      isEnglish 
                      isActive={activeGroupId === t.groupId && t.groupId > 0}
                      onTokenClick={handleTokenInteraction}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const TranscriptSkeleton = () => (
  <div className="space-y-6 animate-pulse mt-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex gap-3 px-6">
        <div className="w-1 h-10 bg-rose-50 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 bg-rose-100/20 rounded-lg" />
          <div className="h-3 w-28 bg-gray-100/50 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const TranscriptStream: React.FC<TranscriptStreamProps> = ({ nodes, activeNodeId, onSeek, isTranslationVisible }) => {
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const hasContent = nodes && nodes.length > 0;

  const handleTokenClick = (groupId: number) => {
    setActiveGroupId(prev => prev === groupId ? null : groupId);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-rose-100 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        <div className="max-w-2xl mx-auto py-6">
          {!hasContent ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-full bg-white shadow-sm border border-rose-50 text-rose-200 mb-4">
                  <ScrollText className="w-8 h-8" />
                </div>
                <h3 className="font-coquette-header text-lg text-gray-700 font-bold mb-1">Analyzing Parallel Script...</h3>
                <TranscriptSkeleton />
             </div>
          ) : (
            nodes.map((line) => (
              <TranscriptLine 
                key={line.id} 
                line={line} 
                isActive={activeNodeId === line.id}
                isTranslationVisible={isTranslationVisible}
                onSeek={onSeek}
                activeGroupId={activeGroupId}
                onTokenClick={handleTokenClick}
              />
            ))
          )}
          <div className="h-32" />
        </div>
      </div>
    </div>
  );
};

export default TranscriptStream;
