
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Clapperboard, 
  Smartphone, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2,
  FileVideo
} from 'lucide-react';
import { getVideoMetadata, fileToBase64 } from '../../utils/videoMetadata';
import { analyzeImmersionMedia } from '../../services/immersionService';
import { useImmersionStore } from '../../store/useImmersionStore';

interface UploadGatewayProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadGateway: React.FC<UploadGatewayProps> = ({ isOpen, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ msg: string; progress: number } | null>(null);
  const { addAnalyzedVideo, setLayoutMode, setIsAnalyzing } = useImmersionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setError(null);
    
    try {
      const firstFile = files[0];
      const meta = await getVideoMetadata(firstFile);
      const isVertical = meta.height > meta.width;

      if (!isVertical && files.length > 1) {
        setError("Cinema Mode (Horizontal) only supports one video at a time for deep analysis.");
        return;
      }

      setIsAnalyzing(true);
      setLayoutMode(isVertical ? 'split' : 'stacked');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileMeta = await getVideoMetadata(file);
        
        setStatus({ msg: `Analyzing ${file.name}...`, progress: Math.round(((i + 1) / files.length) * 100) });
        
        const base64 = await fileToBase64(file);
        const analysis = await analyzeImmersionMedia(base64, file.type, fileMeta.duration);
        
        addAnalyzedVideo(file, analysis);
      }

      setStatus({ msg: "Immersive chronicle complete!", progress: 100 });
      setTimeout(() => {
        onClose();
        setStatus(null);
        setIsAnalyzing(false);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "The Neural Link failed to process this media.");
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-rose-950/20 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 30 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-rose-100 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-rose-50 bg-rose-50/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-rose-400 shadow-sm border border-rose-50">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-coquette-header text-gray-800 tracking-tight">MEDIA INGESTION</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 font-bold mt-1">AI TRANSCRIPTION & COLOR-MAPPING</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-300 hover:text-rose-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            {!status ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative min-h-[340px] rounded-[32px] border-4 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group
                  ${isDragging ? 'bg-rose-50 border-rose-400' : 'bg-gray-50/50 border-gray-100 hover:border-rose-200 hover:bg-rose-50/30'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files && processFiles(e.target.files)} 
                  className="hidden" 
                  multiple 
                  accept="video/*"
                />

                <div className="flex flex-col items-center flex-1 justify-center py-10">
                  <div className="p-5 rounded-full bg-white shadow-md text-rose-300 mb-6 group-hover:scale-110 transition-transform duration-500 border border-rose-50">
                    <FileVideo className="w-10 h-10" />
                  </div>
                  
                  <h3 className="text-xl font-bold font-coquette-header text-gray-700 tracking-wide">DROP YOUR IMMERSION CLIPS</h3>
                  <p className="text-xs font-coquette-body text-gray-400 italic mt-2">MP4, MOV, or WebM accepted</p>
                </div>

                {/* Mode Indicators - Positioned at the bottom for cleaner look */}
                <div className="w-full border-t border-gray-100/50 bg-white/40 py-4 flex justify-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-rose-100 text-[9px] font-black uppercase text-gray-400 shadow-sm">
                    <Smartphone className="w-3.5 h-3.5 text-rose-300" /> Vertical Batch
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-rose-100 text-[9px] font-black uppercase text-gray-400 shadow-sm">
                    <Clapperboard className="w-3.5 h-3.5 text-rose-300" /> Cinema Single
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[340px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-rose-400">
                    {status.progress === 100 ? <CheckCircle2 className="w-10 h-10 text-emerald-400" /> : <Sparkles className="w-8 h-8 animate-pulse" />}
                  </div>
                </div>
                <div>
                   <h3 className="text-2xl font-bold font-coquette-header text-gray-800">{status.msg}</h3>
                   <div className="w-64 h-2 bg-gray-100 rounded-full mt-4 mx-auto overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${status.progress}%` }} 
                        className="h-full bg-rose-400"
                      />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-rose-300 mt-4">Consulting the Immersion Engine</p>
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-500"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-rose-50 text-center">
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
               Verbatim Mode Enabled • Full duration transcription
             </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadGateway;
