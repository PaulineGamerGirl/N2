import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Scroll } from 'lucide-react';
import { ParsedGrammarPoint } from '../utils/grammarParser';

interface GrammarListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  points: ParsedGrammarPoint[];
}

const GrammarListModal: React.FC<GrammarListModalProps> = ({ isOpen, onClose, title, points }) => {

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div 
          className="relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] bg-[#fffcfc] border-coquette-gold/30"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center bg-white border-coquette-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-coquette-bg">
                <Scroll className="w-5 h-5 text-coquette-gold" />
              </div>
              <div>
                 <h2 className="text-xl font-bold tracking-wide font-coquette-header text-coquette-text">
                   Collected Notes
                 </h2>
                 <p className="text-sm font-mono text-coquette-subtext">{title}</p>
              </div>
            </div>
            <button onClick={onClose} className="transition-colors p-2 rounded-full text-gray-400 hover:text-coquette-text hover:bg-coquette-bg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-coquette-accent/50">
            {points.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                 <Scroll className="w-8 h-8 opacity-20" />
                 <p className="font-mono text-sm">No notes found for this chapter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                 {points.map((gp) => (
                    <div key={gp.id} className="border rounded-lg p-4 transition-colors group bg-white border-gray-100 hover:border-coquette-gold/30 shadow-sm">
                       <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-coquette-text font-coquette-body">{gp.point}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-coquette-bg text-coquette-subtext">
                             ID: {gp.id.substring(0, 4)}
                          </span>
                       </div>
                       <p className="font-medium mb-3 text-gray-600">{gp.meaning}</p>
                       
                       {gp.sentences && (
                         <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                               <BookOpen className="w-3 h-3" />
                               <span>EXAMPLE PATTERN</span>
                            </div>
                            <p className="text-sm italic p-2 rounded border-l-2 bg-gray-50 text-gray-600 border-coquette-accent">
                              {gp.sentences}
                            </p>
                         </div>
                       )}
                    </div>
                 ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t text-center bg-white border-coquette-border">
            <span className="text-xs font-mono text-coquette-subtext">
               {points.length} entries found
            </span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GrammarListModal;