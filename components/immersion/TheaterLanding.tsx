
import React from 'react';
import { motion } from 'framer-motion';
import { Clapperboard, Plus, Sparkles, Smartphone, Tv, Film } from 'lucide-react';

interface TheaterLandingProps {
  onOpenUpload: () => void;
}

const TheaterLanding: React.FC<TheaterLandingProps> = ({ onOpenUpload }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-[#fffcfc] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-pink-100/30 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-coquette-gold/10 rounded-full blur-[60px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center z-10"
      >
        <div className="inline-flex items-center justify-center p-6 bg-white rounded-[40px] shadow-xl border border-rose-50 mb-10 relative group">
           <div className="absolute inset-0 bg-rose-50 rounded-[40px] scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
           <Clapperboard className="w-16 h-16 text-coquette-accent relative z-10" />
           <motion.div 
             animate={{ rotate: [0, 10, -10, 0] }}
             transition={{ repeat: Infinity, duration: 4 }}
             className="absolute -top-2 -right-2 p-2 bg-coquette-gold rounded-full text-white shadow-lg"
           >
              <Sparkles className="w-4 h-4" />
           </motion.div>
        </div>

        <h1 className="text-5xl font-bold font-coquette-header text-coquette-text mb-4 tracking-tight italic">
          Immersion Theater
        </h1>
        <p className="text-xl font-coquette-body text-coquette-subtext italic mb-12 max-w-lg mx-auto leading-relaxed">
          Transform your favorite Japanese content into a deep learning experience with AI-powered transcription and linguistic mapping.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/60 backdrop-blur-sm border border-rose-100 p-6 rounded-[32px] flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
             <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 mb-4">
                <Smartphone className="w-6 h-6" />
             </div>
             <h3 className="font-bold font-coquette-header text-gray-700 text-sm uppercase tracking-widest">TikTok Mode</h3>
             <p className="text-xs text-gray-400 mt-2 font-coquette-body">Batch process multiple vertical clips for quick-fire immersion.</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm border border-rose-100 p-6 rounded-[32px] flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 mb-4">
                <Tv className="w-6 h-6" />
             </div>
             <h3 className="font-bold font-coquette-header text-gray-700 text-sm uppercase tracking-widest">Cinema Mode</h3>
             <p className="text-xs text-gray-400 mt-2 font-coquette-body">Deep-dive into long-form horizontal videos with virtual chunking.</p>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenUpload}
          className="group relative inline-flex items-center gap-4 px-12 py-5 bg-coquette-accent text-white rounded-full font-bold shadow-[0_15px_40px_rgba(244,172,183,0.3)] hover:bg-[#ff9eb0] transition-all"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-lg uppercase tracking-[0.2em] font-black">Begin Ingestion</span>
          <div className="absolute -inset-1 rounded-full border border-rose-200 animate-pulse opacity-50" />
        </motion.button>

        <div className="mt-16 flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
           <div className="flex items-center gap-2"><Film className="w-3.5 h-3.5" /> MP4 / MOV</div>
           <div className="w-1 h-1 rounded-full bg-gray-200" />
           <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> AI VERBATIM</div>
           <div className="w-1 h-1 rounded-full bg-gray-200" />
           <div className="flex items-center gap-2"><Tv className="w-3.5 h-3.5" /> 4K SUPPORT</div>
        </div>
      </motion.div>
    </div>
  );
};

export default TheaterLanding;
