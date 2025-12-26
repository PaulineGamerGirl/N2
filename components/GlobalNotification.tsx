
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Sparkles } from 'lucide-react';
import { useImmersionStore } from '../store/useImmersionStore';

const GlobalNotification: React.FC = () => {
  const { globalNotification, dismissNotification } = useImmersionStore();

  if (!globalNotification?.show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-6 right-6 z-[300] w-full max-w-sm"
      >
        <div className="bg-white border-2 border-emerald-100 rounded-[28px] shadow-[0_15px_40px_rgba(16,185,129,0.15)] overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 shadow-inner">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
               <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                 <Sparkles className="w-3 h-3 text-emerald-400" /> System Sync
               </h4>
               <p className="text-xs text-gray-500 font-coquette-body italic mt-0.5">{globalNotification.message}</p>
            </div>
            <button 
              onClick={dismissNotification}
              className="p-2 rounded-full hover:bg-emerald-50 text-gray-300 hover:text-emerald-500 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-1 bg-emerald-500 w-full" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalNotification;
