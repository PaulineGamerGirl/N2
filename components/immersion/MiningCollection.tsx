
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Volume2, 
  X, 
  Download, 
  Loader2, 
  Search, 
  Calendar, 
  Film, 
  CheckSquare, 
  Square,
  Library,
  Layers,
  History,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useImmersionStore } from '../../store/useImmersionStore';
import { MinedCard } from '../../types/immersionSchema';
import { exportToAnki } from '../../services/ankiExport';
import { getBatchReadings } from '../../services/immersionService';
import { format } from 'date-fns';

type GroupByMode = 'ANIME' | 'DATE';

const MiningCollection: React.FC = () => {
  const { minedCards } = useImmersionStore();
  
  // --- STATE ---
  const [groupBy, setGroupBy] = useState<GroupByMode>('ANIME');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState<string | null>(null);

  // --- GROUPING LOGIC ---
  const groupedData = useMemo(() => {
    const filtered = minedCards.filter(card => 
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.sourceTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, MinedCard[]> = {};

    filtered.forEach(card => {
      let key = '';
      if (groupBy === 'ANIME') {
        const title = card.sourceTitle || '';
        if (!title || title === 'Untitled Session' || title === 'Analyzed Media' || title === 'Analyzed Content') {
          key = 'Other Immersion';
        } else {
          key = title;
        }
      } else {
        key = format(new Date(card.timestamp), 'MMMM dd, yyyy');
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(card);
    });

    return Object.entries(groups).sort(([keyA, cardsA], [keyB, cardsB]) => {
      if (groupBy === 'DATE') return cardsB[0].timestamp - cardsA[0].timestamp;
      if (keyA === 'Other Immersion') return 1;
      if (keyB === 'Other Immersion') return -1;
      return keyA.localeCompare(keyB);
    });
  }, [minedCards, searchTerm, groupBy]);

  // --- SELECTION HANDLERS ---
  const toggleCard = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleGroup = (cardIds: string[]) => {
    const next = new Set(selectedIds);
    const allInGroupSelected = cardIds.every(id => next.has(id));
    if (allInGroupSelected) cardIds.forEach(id => next.delete(id));
    else cardIds.forEach(id => next.add(id));
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // --- ACTIONS ---
  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(console.error);
  };

  const handleExport = async () => {
    const cardsToExport = minedCards.filter(c => selectedIds.has(c.id));
    if (cardsToExport.length === 0 || isExporting) return;
    
    setIsExporting(true);
    try {
      setExportStep('Generating Readings...');
      const itemsForReading = cardsToExport.map(c => ({
        id: c.id,
        word: c.front,
        sentence: c.back
      }));
      
      const readings = await getBatchReadings(itemsForReading);
      
      setExportStep('Syncing Anki...');
      await exportToAnki(cardsToExport, readings);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
      setExportStep(null);
    }
  };

  const totalSelected = selectedIds.size;
  const hasCards = minedCards.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#fffcfc] rounded-[30px] overflow-hidden">
      {/* Search & Control Header */}
      <div className="p-6 border-b border-rose-100 flex flex-col md:flex-row items-center justify-between bg-white sticky top-0 z-20 shadow-sm gap-6">
        <div className="flex items-center gap-6 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter by keyword or source..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-200 text-sm font-coquette-body transition-all outline-none"
            />
          </div>

          <div className="flex bg-rose-50 p-1 rounded-2xl border border-rose-100 shrink-0">
             <button onClick={() => setGroupBy('ANIME')} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'ANIME' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}><Film className="w-3 h-3" /> By Anime</button>
             <button onClick={() => setGroupBy('DATE')} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'DATE' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}><History className="w-3 h-3" /> By Day</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            {totalSelected > 0 && <button onClick={clearSelection} className="text-[9px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors px-2">Clear Selection</button>}
            <div className="text-[10px] font-black uppercase tracking-widest text-coquette-subtext bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">{totalSelected > 0 ? `${totalSelected} Selected` : `${minedCards.length} Cards Total`}</div>
          </div>
          
          <button 
            disabled={totalSelected === 0 || isExporting}
            onClick={handleExport}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-md active:scale-95 min-w-[180px] justify-center
              ${totalSelected === 0 || isExporting 
                ? 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed' 
                : 'bg-rose-400 text-white hover:bg-rose-500 border border-rose-300 shadow-rose-100'}
            `}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{exportStep || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export {totalSelected > 0 ? totalSelected : ''} to Anki</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-rose-200">
        {!hasCards ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-rose-400 flex items-center justify-center mb-6">
              <Library className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="text-xl font-coquette-header text-gray-700 font-bold mb-2">The Archives are Still</h3>
            <p className="max-w-xs font-coquette-body italic">Enter "Anime Mode" in the theater to begin your harvest of fragments.</p>
          </div>
        ) : (
          <div className="space-y-12 max-w-6xl mx-auto">
            {groupedData.map(([title, cards]) => {
              const cardIds = cards.map(c => c.id);
              const allInGroupSelected = cardIds.every(id => selectedIds.has(id));
              const someInGroupSelected = cardIds.some(id => selectedIds.has(id)) && !allInGroupSelected;
              return (
                <div key={title} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4 flex-1">
                      <button onClick={() => toggleGroup(cardIds)} className={`p-1.5 rounded-lg transition-all ${allInGroupSelected ? 'text-rose-500' : 'text-gray-300 hover:text-rose-300'}`}>{allInGroupSelected ? <CheckSquare className="w-5 h-5" /> : (someInGroupSelected ? <Layers className="w-5 h-5 text-rose-400" /> : <Square className="w-5 h-5" />)}</button>
                      <h2 className="text-lg font-bold font-coquette-header text-gray-700 uppercase tracking-[0.15em] italic flex items-center gap-3">{groupBy === 'ANIME' ? <Film className="w-4 h-4 text-rose-300" /> : <Calendar className="w-4 h-4 text-rose-300" />}{title}<span className="text-[10px] lowercase font-sans opacity-40 not-italic tracking-normal ml-1">({cards.length})</span></h2>
                      <div className="flex-1 h-px bg-rose-50" />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-[25px] border border-rose-100 bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-rose-50/20 text-[9px] font-black uppercase tracking-widest text-rose-400 border-b border-rose-100">
                          <th className="w-12 px-6 py-4"></th>
                          <th className="px-6 py-4">Target Word</th>
                          <th className="px-6 py-4">Meaning</th>
                          <th className="px-6 py-4 hidden lg:table-cell">Context Fragment</th>
                          <th className="px-6 py-4 text-center">Scene</th>
                          <th className="px-6 py-4 text-center">Audio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50">
                        {cards.map((card) => {
                          const isCardSelected = selectedIds.has(card.id);
                          return (
                            <motion.tr key={card.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => toggleCard(card.id)} className={`cursor-pointer transition-colors group ${isCardSelected ? 'bg-rose-50/50' : 'hover:bg-rose-50/20'}`}><td className="px-6 py-5"><div className={`transition-all ${isCardSelected ? 'text-rose-500' : 'text-gray-200 group-hover:text-rose-200'}`}>{isCardSelected ? <CheckCircle2 className="w-5 h-5" /> : <Square className="w-5 h-5" />}</div></td><td className="px-6 py-5"><span className={`text-lg font-bold font-coquette-body transition-colors ${isCardSelected ? 'text-rose-700' : 'text-gray-800'}`}>{card.front}</span></td><td className="px-6 py-5"><span className="text-sm text-gray-500 font-coquette-body italic">{card.translation}</span></td><td className="px-6 py-5 hidden lg:table-cell"><p className="text-xs text-gray-400 line-clamp-1 max-w-sm leading-relaxed">{card.back}</p></td><td className="px-6 py-5 text-center">{card.image && <button onClick={(e) => { e.stopPropagation(); setSelectedImage(card.image); }} className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"><ImageIcon className="w-4 h-4" /></button>}</td><td className="px-6 py-5 text-center">{card.audio && <button onClick={(e) => { e.stopPropagation(); playAudio(card.audio); }} className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm"><Volume2 className="w-4 h-4" /></button>}</td></motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 backdrop-blur-md bg-black/80">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative max-w-5xl w-full aspect-video rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/10">
              <img src={selectedImage} alt="Mined Evidence" className="w-full h-full object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"><X className="w-6 h-6" /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MiningCollection;
