
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Star, Trash2, AlertCircle, Calendar, Image as ImageIcon, CheckCircle2, Circle, MonitorPlay, Sparkles } from 'lucide-react';
import { useProgressStore, Keepsake, MediaType, MediaStatus } from '../store/progressStore';
import { useImmersionStore } from '../store/useImmersionStore';

interface LogMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  forcedTheaterMode?: boolean; // New prop
}

const LogMemoryModal: React.FC<LogMemoryModalProps> = ({ isOpen, onClose, editingId, forcedTheaterMode = false }) => {
  const { keepsakes, addKeepsake, updateKeepsake, removeKeepsake } = useProgressStore();
  const { addSeries, removeSeries } = useImmersionStore();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('ANIME');
  const [status, setStatus] = useState<MediaStatus>('ONGOING');
  const [cover, setCover] = useState('');
  const [rating, setRating] = useState(5);
  const [metric, setMetric] = useState('');
  const [dateCompleted, setDateCompleted] = useState(new Date().toISOString().split('T')[0]);
  const [caption, setCaption] = useState('');
  const [showInTheater, setShowInTheater] = useState(false);
  const [totalEpisodes, setTotalEpisodes] = useState('24');

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const item = keepsakes.find(k => k.id === editingId);
        if (item) {
          setTitle(item.title);
          setType(item.type);
          setStatus(item.status || 'ONGOING');
          setCover(item.coverUrl);
          setRating(item.rating);
          setMetric(item.durationOrVolumes ? item.durationOrVolumes.toString() : '');
          setDateCompleted(item.dateCompleted || item.dateAdded);
          setCaption(item.caption);
          setShowInTheater(!!item.showInTheater);
          setTotalEpisodes(item.totalEpisodes ? item.totalEpisodes.toString() : '24');
        }
      } else {
        // Reset for new entry
        setTitle('');
        setType('ANIME');
        setStatus('ONGOING');
        setCover('');
        setRating(5);
        setMetric('');
        setDateCompleted(new Date().toISOString().split('T')[0]);
        setCaption('');
        // If forced, default theater to true
        setShowInTheater(forcedTheaterMode);
        setTotalEpisodes('24');
      }
      setConfirmDelete(false);
    }
  }, [editingId, isOpen, forcedTheaterMode, keepsakes]);

  const handleRemove = () => {
    if (!editingId) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    
    const item = keepsakes.find(k => k.id === editingId);
    if (item?.showInTheater) removeSeries(editingId);
    
    removeKeepsake(editingId);
    onClose();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || crypto.randomUUID();
    
    // In forced mode, it's always in theater and always anime
    const actualShowInTheater = forcedTheaterMode || showInTheater;
    const actualType = forcedTheaterMode ? 'ANIME' : type;

    const commonData = {
      title,
      type: actualType,
      status,
      coverUrl: cover || `https://via.placeholder.com/300x450?text=${encodeURIComponent(title)}`,
      rating,
      caption,
      durationOrVolumes: metric === '' ? 0 : Number(metric),
      dateCompleted,
      showInTheater: actualShowInTheater,
      totalEpisodes: actualShowInTheater ? Number(totalEpisodes) : undefined
    };

    if (editingId) {
      updateKeepsake(editingId, commonData);
    } else {
      addKeepsake({
        id,
        ...commonData,
        dateAdded: new Date().toISOString().split('T')[0]
      });
    }

    if (actualShowInTheater && actualType === 'ANIME') {
      addSeries({
        id,
        title,
        totalEpisodes: Number(totalEpisodes),
        coverUrl: commonData.coverUrl
      });
    } else {
      removeSeries(id);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden bg-[#fffcfc] border border-coquette-gold/30 flex flex-col max-h-[90vh]">
          <div className="p-8 border-b border-rose-100 bg-rose-50/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-coquette-accent shadow-sm border border-rose-50">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold font-coquette-header text-coquette-text">{editingId ? 'Edit Memory' : 'Log a New Memory'}</h2>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">Preserving your journey</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
            <div className="bg-white p-5 rounded-[32px] border border-rose-100 shadow-sm space-y-4">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Current Progress</label>
              <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                <button type="button" onClick={() => setStatus('ONGOING')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${status === 'ONGOING' ? 'bg-white text-emerald-500 shadow-sm border border-emerald-100' : 'text-gray-400 hover:bg-gray-100'}`}>
                  {status === 'ONGOING' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />} Ongoing Session
                </button>
                <button type="button" onClick={() => setStatus('FINISHED')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${status === 'FINISHED' ? 'bg-white text-rose-500 shadow-sm border border-rose-100' : 'text-gray-400 hover:bg-gray-100'}`}>
                  {status === 'FINISHED' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />} Finished Journey
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Chronicle Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. My Neighbor Totoro" className="w-full p-4 rounded-2xl border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none font-bold text-gray-700 bg-gray-50/50 transition-all text-lg" />
              </div>
              
              {!forcedTheaterMode && (
                <>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Category</label>
                    <select value={type} onChange={e => setType(e.target.value as MediaType)} className="w-full p-4 rounded-2xl border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none appearance-none bg-gray-50/50 text-gray-700 font-bold transition-all"><option value="ANIME">Anime</option><option value="MANGA">Manga</option><option value="GAME">Game</option><option value="SHOW">Show</option></select>
                  </div>
                </>
              )}
              
              <div className={`space-y-2 ${forcedTheaterMode ? 'col-span-2' : ''}`}>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Rating</label>
                <div className="flex gap-2 items-center h-[56px] px-2">{[1, 2, 3, 4, 5].map(star => (<button type="button" key={star} onClick={() => setRating(star)} className={`transition-all transform hover:scale-110 ${star <= rating ? 'text-coquette-gold' : 'text-gray-200'}`}><Star className="w-8 h-8 fill-current" /></button>))}</div>
              </div>
            </div>

            {(forcedTheaterMode || type === 'ANIME') && (
              <div className="p-6 rounded-[32px] bg-rose-50 border-2 border-dashed border-rose-200 space-y-6">
                {!forcedTheaterMode && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-rose-400">
                        <MonitorPlay className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-rose-700 font-coquette-header">Enable Immersion Theater</span>
                        <p className="text-[9px] text-rose-300 font-bold uppercase tracking-widest mt-0.5">Automated Series Ingestion</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowInTheater(!showInTheater)} className={`w-14 h-8 rounded-full transition-all relative ${showInTheater ? 'bg-rose-400 shadow-inner' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${showInTheater ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                )}
                
                {(forcedTheaterMode || showInTheater) && (
                  <motion.div initial={forcedTheaterMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-4 border-t border-rose-200/50">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-rose-400">Total Archive Episodes</label>
                    <input type="number" value={totalEpisodes} onChange={e => setTotalEpisodes(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-rose-100 bg-white text-lg font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-200 transition-all" placeholder="37" />
                    <p className="text-[10px] text-rose-400 italic bg-white/50 p-3 rounded-xl border border-rose-100">"This series will blossom within your Theater automatically, synchronized with this keepsake."</p>
                  </motion.div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Cover Imagery (URL)</label>
                <div className="flex gap-4 items-center">
                  {cover && <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg flex-shrink-0 bg-gray-50"><img src={cover} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src='https://via.placeholder.com/100x100?text=?'; }} /></div>}
                  <input type="text" value={cover} onChange={e => setCover(e.target.value)} placeholder="https://i.pinimg.com/..." className="flex-1 p-4 rounded-2xl border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none bg-gray-50/50 text-gray-600 font-mono text-xs transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">{type === 'MANGA' ? 'Volumes Explored' : 'Immersion Minutes'}</label>
                <div className="relative">
                  <input type="number" value={metric} onChange={e => setMetric(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none bg-gray-50/50 text-gray-700 font-bold transition-all" placeholder="83" />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-300 uppercase tracking-widest pointer-events-none">{type === 'MANGA' ? 'Vols' : 'Mins'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Date Memorialized</label>
                <div className="relative">
                  <input type="date" required value={dateCompleted} onChange={e => setDateCompleted(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none bg-gray-50/50 text-gray-700 font-bold transition-all" />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-200 w-5 h-5 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Personal Reflections</label>
                  <span className={`text-[10px] font-bold ${caption.length > 75 ? 'text-red-500' : 'text-rose-300'}`}>{caption.length}/75</span>
                </div>
                <textarea rows={2} required maxLength={75} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Describe the feeling of this memory..." className="w-full p-4 rounded-2xl border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none resize-none bg-gray-50/50 text-gray-700 font-coquette-body italic transition-all" />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-rose-100 sticky bottom-0 bg-[#fffcfc] z-10 pb-4">
              {editingId && (
                <button type="button" onClick={handleRemove} className={`w-16 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center shrink-0 ${confirmDelete ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-white border-rose-100 text-rose-300 hover:bg-rose-50 hover:text-red-400'}`}>
                  {confirmDelete ? <AlertCircle className="w-6 h-6 animate-pulse" /> : <Trash2 className="w-6 h-6" />}
                </button>
              )}
              <button type="submit" className="flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-sm transition-all shadow-xl bg-coquette-accent text-white hover:bg-[#ff9eb0] hover:scale-[1.02] active:scale-95 shadow-rose-100">
                {editingId ? 'Refine Memory' : 'Commit to Archive'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LogMemoryModal;
