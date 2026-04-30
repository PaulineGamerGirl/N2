import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, ArrowRight } from 'lucide-react';

export interface ExplanationOccurrence {
  category: string;
  reason: string;
}

export interface LineCorrection {
  original: string;
  correction: string;
  explanations: ExplanationOccurrence[];
}

export interface CorrectionData {
  lineByLine: LineCorrection[];
  improvedVersion: string;
}

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CorrectionData | null;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  // Defensive handling for legacy data format (from localStorage)
  const lineByLine = data.lineByLine || (data.original ? [{
    original: data.original,
    correction: (data as any).corrected || (data as any).better || '',
    explanations: (data as any).explanation || (data as any).reason ? [{
      category: 'General',
      reason: (data as any).explanation || (data as any).reason || ''
    }] : []
  }] : []);

  const improvedVersion = data.improvedVersion || (data as any).corrected || (data as any).better || '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#fffcfc] rounded-[30px] border border-rose-200 shadow-[0_10px_40px_rgba(244,172,183,0.3)] overflow-hidden"
        >
           {/* Header */}
           <div className="bg-pink-50/50 p-6 border-b border-rose-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-full border border-rose-100 text-rose-400 shadow-sm">
                    <Wand2 className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-coquette-header text-lg font-bold text-gray-700">Detailed Analysis</h3>
                    <p className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">Phrase-by-Phrase Insight</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-rose-400 transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
           </div>

           {/* Content */}
           <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Line by Line Section */}
              <div className="space-y-6">
                {lineByLine.map((line, idx) => (
                  <div key={idx} className="group relative bg-white rounded-2xl border border-rose-50 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-rose-400 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Original vs Correction */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Student</label>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                            "{line.original}"
                          </p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block mb-1">Native</label>
                          <p className="text-sm text-rose-800 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                            {line.correction}
                          </p>
                        </div>
                      </div>

                      {/* Explanations */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Grammar Breakdown</label>
                        <div className="space-y-2">
                          {line.explanations && line.explanations.map((exp, eIdx) => (
                            <div key={eIdx} className="flex gap-2 items-start bg-rose-50/30 p-2 rounded-lg border border-rose-100/50">
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 text-[10px] font-bold uppercase whitespace-nowrap">
                                {exp.category}
                              </span>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {exp.reason}
                              </p>
                            </div>
                          ))}
                          {(!line.explanations || line.explanations.length === 0) && (
                            <p className="text-xs text-gray-400 italic">Perfect as is!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Improved Version Summary */}
              <div className="pt-4 border-t border-rose-100">
                <label className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Final Polished Paragraph
                </label>
                <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold font-coquette-body text-base shadow-xl shadow-rose-200/50 leading-relaxed">
                  {improvedVersion}
                </div>
              </div>
           </div>

           {/* Footer */}
           <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <button 
                onClick={onClose}
                className="text-xs font-bold text-gray-400 hover:text-rose-400 transition-colors uppercase tracking-widest"
              >
                 Mastered it!
              </button>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CorrectionModal;