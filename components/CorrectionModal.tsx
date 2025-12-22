import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, ArrowRight } from 'lucide-react';

export interface CorrectionData {
  original: string;
  corrected: string;
  explanation: string;
}

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CorrectionData | null;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

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
          className="relative w-full max-w-md bg-[#fffcfc] rounded-[30px] border border-rose-200 shadow-[0_10px_40px_rgba(244,172,183,0.3)] overflow-hidden"
        >
           {/* Header */}
           <div className="bg-pink-50/50 p-6 border-b border-rose-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-full border border-rose-100 text-rose-400 shadow-sm">
                    <Wand2 className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-coquette-header text-lg font-bold text-gray-700">Grammar Note</h3>
                    <p className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">Stealth Correction</p>
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
           <div className="p-6 space-y-6">
              {/* Original */}
              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Original</label>
                 <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 font-coquette-body text-sm relative">
                    "{data.original}"
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-gray-100 text-gray-300">
                       <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                 </div>
              </div>

              {/* Correction */}
              <div className="space-y-2 pt-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Suggested Natural Phrasing
                 </label>
                 <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold font-coquette-body text-sm shadow-sm">
                    {data.corrected}
                 </div>
              </div>

              {/* Analysis */}
              <div className="bg-white rounded-xl p-4 border border-rose-100 shadow-sm">
                 <p className="text-sm leading-relaxed text-gray-600 font-sans">
                   <span className="font-bold text-rose-400 font-coquette-body">Sensei's Note:</span> {data.explanation}
                 </p>
              </div>
           </div>

           {/* Footer */}
           <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <button 
                onClick={onClose}
                className="text-xs font-bold text-gray-400 hover:text-rose-400 transition-colors uppercase tracking-widest"
              >
                 Dismiss Note
              </button>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CorrectionModal;