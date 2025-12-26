
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, TrendingUp, Info, Upload, BookOpen, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { dictionaryService, WordMeta } from '../../services/dictionaryService';
import { ImmersionToken } from '../../types/immersionSchema';

interface FrequencyDockProps {
  targetToken: ImmersionToken | null;
  episodeNodes: any[];
}

const FrequencyDock: React.FC<FrequencyDockProps> = ({ targetToken, episodeNodes }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [meta, setMeta] = useState<WordMeta | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await dictionaryService.isHydrated();
      setIsHydrated(status);
    };
    checkStatus();
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      if (targetToken && isHydrated) {
        let result = null;
        
        // Priority 1: AI-determined Base Form (Best Accuracy)
        if (targetToken.baseForm) {
          result = await dictionaryService.getWordMeta(targetToken.baseForm);
        }
        
        // Priority 2: Surface Form (Exact Match)
        if (result === null) {
          result = await dictionaryService.getWordMeta(targetToken.text);
        }
        
        // Priority 3: Simple Deconjugation Heuristics (Fallback)
        if (result === null) {
          const text = targetToken.text;
          const heuristics = [
             text.replace(/[。、？！]/g, ''), 
             text.replace(/(ります|います|します)$/, 'る'),
             text.replace(/(ない)$/, ''), 
             text.replace(/(った)$/, 'る'), 
             text.replace(/(って)$/, 'る'), 
          ];
          
          for (const attempt of heuristics) {
             if (attempt !== text) {
                result = await dictionaryService.getWordMeta(attempt);
                if (result !== null) break;
             }
          }
        }
        
        setMeta(result);
      } else {
        setMeta(null);
      }
    };
    fetchMeta();
  }, [targetToken, isHydrated]);

  const episodeCount = useMemo(() => {
    if (!targetToken) return 0;
    const lookupText = targetToken.text;
    return episodeNodes.reduce((acc, node) => {
      const jpTokens = node.japanese || [];
      return acc + jpTokens.filter((t: any) => t.text === lookupText).length;
    }, 0);
  }, [targetToken, episodeNodes]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setError(null);
    try {
      if (file.name.includes('.json')) {
         const count = await dictionaryService.importJPDB(file);
         if (count > 0) {
            setIsHydrated(true);
         } else {
            setError("No valid entries found in JPDB file.");
         }
      } else {
         setError("Please upload a valid JSON dictionary file.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Import Failed. Check format.");
    } finally {
      setIsImporting(false);
    }
  };

  // Only render if a token is selected to avoid distracting the user
  if (!targetToken) return null;

  return (
    <motion.div
      initial={{ x: -120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -120, opacity: 0 }}
      className="fixed left-8 top-[35%] -translate-y-1/2 z-[150] w-64 pointer-events-auto min-h-[250px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-7 shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col gap-6 relative overflow-hidden">
        
        {/* Decorative Background Glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER: The Word Itself */}
        <div className="flex items-center gap-4 relative z-10 mb-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-3xl font-bold text-white font-coquette-header leading-none truncate">
               {targetToken.text}
            </h3>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mt-1 truncate">
               {targetToken.baseForm || 'Lexeme'}
            </p>
          </div>
        </div>

        {!isHydrated ? (
          <div className="space-y-4 relative z-10">
             <div className="p-5 rounded-[28px] bg-white/5 border border-white/5 text-center flex flex-col gap-3">
                <p className="text-[9px] text-white/40 leading-relaxed font-medium italic">
                   Upload your <strong>JPDB JSON</strong> export.
                </p>
                <label className={`
                  block w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer bg-white/10 text-white/60 hover:bg-white/20 border border-white/5
                `}>
                  {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Load Dictionary'}
                  <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                </label>
                {error && <p className="text-[9px] text-red-400 font-bold bg-red-500/10 p-2 rounded-xl">{error}</p>}
             </div>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* RANK CARD */}
              <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 shadow-inner relative overflow-hidden group">
                 {/* Subtle BG Icon */}
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <TrendingUp className="w-20 h-20 text-white" />
                 </div>

                 <div className="relative z-10">
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Global Freq</span>
                   <div className="text-5xl font-bold text-white font-coquette-header tracking-tight drop-shadow-lg">
                      {meta ? `#${meta.rank.toLocaleString()}` : '---' }
                   </div>
                   
                   {/* JLPT Badge - Enhanced Size */}
                   <div className="flex items-center gap-2 mt-3">
                      <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-lg font-coquette-header shadow-[0_0_10px_rgba(16,185,129,0.15)] backdrop-blur-md">
                          {meta ? meta.jlpt : 'Unknown'}
                      </div>
                   </div>
                 </div>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="space-y-2">
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block ml-1">Context Usage</span>
                 <div className="flex items-baseline gap-3 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                    <span className="text-3xl font-bold text-rose-400 font-coquette-header">{episodeCount}</span>
                    <span className="text-[9px] font-black text-rose-500/40 uppercase tracking-widest">Occurrences</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FrequencyDock;
