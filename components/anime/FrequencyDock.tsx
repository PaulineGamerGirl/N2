
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, TrendingUp, Info, Upload, BookOpen, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { dictionaryService } from '../../services/dictionaryService';
import { ImmersionToken } from '../../types/immersionSchema';

interface FrequencyDockProps {
  targetToken: ImmersionToken | null;
  episodeNodes: any[];
}

const FrequencyDock: React.FC<FrequencyDockProps> = ({ targetToken, episodeNodes }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
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
    const fetchRank = async () => {
      if (targetToken && isHydrated) {
        let value = null;
        if (targetToken.baseForm) {
          value = await dictionaryService.getWordMeta(targetToken.baseForm);
        }
        if (value === null) {
          value = await dictionaryService.getWordMeta(targetToken.text);
        }
        if (value === null) {
          const normalized = targetToken.text.replace(/[。、？！]/g, '');
          if (normalized !== targetToken.text) {
            value = await dictionaryService.getWordMeta(normalized);
          }
        }
        setRank(value);
      } else {
        setRank(null);
      }
    };
    fetchRank();
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
      await dictionaryService.importJPDB(file);
      setIsHydrated(true);
    } catch (err: any) {
      setError("Import Failed.");
    } finally {
      setIsImporting(false);
    }
  };

  const getJLPT = (r: number) => {
    if (r <= 800) return 'N5 Foundational';
    if (r <= 1500) return 'N4 Core';
    if (r <= 3500) return 'N3 Intermediate';
    if (r <= 7000) return 'N2 Advanced';
    return 'N1 Specialized';
  };

  return (
    <motion.div
      initial={{ x: -120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-50 w-60 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-black/30 backdrop-blur-2xl border border-white/5 rounded-[40px] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white/80 uppercase tracking-widest font-coquette-body">Lexical Scan</h3>
            <p className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-black">Archive Meta</p>
          </div>
        </div>

        {!isHydrated ? (
          <div className="space-y-4">
             <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-center">
                <label className={`
                  block w-full py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer bg-white/10 text-white/60 hover:bg-white/20
                `}>
                  {isImporting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Load Dictionary'}
                  <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                </label>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!targetToken ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-3">
                   <Info className="w-4 h-4 text-white/10" />
                </div>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Select a word...</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="space-y-1">
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block">Rank</span>
                   <div className="text-2xl font-bold text-white font-coquette-header">
                      {rank ? `#${rank.toLocaleString()}` : '???' }
                   </div>
                   <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">
                      {rank ? getJLPT(rank) : 'Rare Form'}
                   </p>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-1">
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block">Density</span>
                   <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-rose-400 font-coquette-header">{episodeCount}</span>
                      <span className="text-[9px] font-black text-rose-500/40 uppercase tracking-widest">Hits</span>
                   </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="flex justify-center border-t border-white/5 pt-4">
           <div className="flex items-center gap-2 opacity-20">
              <Database className="w-2.5 h-2.5 text-white" />
              <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white">Nexus DB</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FrequencyDock;
