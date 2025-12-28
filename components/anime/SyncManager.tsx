
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Minus, History, Upload } from 'lucide-react';
import { useImmersionStore } from '../../store/useImmersionStore';
import { parseSRT } from '../../utils/srtParser';

const SyncManager: React.FC = () => {
  const { subtitleOffset, setSubtitleOffset, playlist, activeIndex, updateVideoNodes } = useImmersionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeVideo = playlist[activeIndex];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVideo) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const nodes = parseSRT(content);
      updateVideoNodes(activeVideo.videoId, nodes);
    };
    reader.readAsText(file);
  };

  const adjustOffset = (amount: number) => {
    setSubtitleOffset(parseFloat((subtitleOffset + amount).toFixed(1)));
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-coquette-header">Sync Chronology</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Lag Fixer v1.0</p>
          </div>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 group"
        >
          <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Inject SRT</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Subtitle Offset</span>
          <span className={`text-sm font-mono font-bold ${subtitleOffset === 0 ? 'text-white/40' : subtitleOffset > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {subtitleOffset > 0 ? '+' : ''}{subtitleOffset.toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => adjustOffset(-0.5)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-all border border-white/5"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <input 
            type="range" 
            min="-10" 
            max="10" 
            step="0.1" 
            value={subtitleOffset} 
            onChange={(e) => setSubtitleOffset(parseFloat(e.target.value))}
            className="flex-1 accent-rose-500 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
          />

          <button 
            onClick={() => adjustOffset(0.5)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-400 transition-all border border-white/5"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={() => setSubtitleOffset(0)}
          disabled={subtitleOffset === 0}
          className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors disabled:opacity-0"
        >
          Reset Timeline
        </button>
      </div>
    </div>
  );
};

export default SyncManager;
