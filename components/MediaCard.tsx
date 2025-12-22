import React from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Clock, BookOpen } from 'lucide-react';
// Fix: remove parseISO from imports
import { format } from 'date-fns';
import { MediaStatus } from '../store/progressStore';

export interface MediaItem {
  id: string;
  title: string;
  type: 'ANIME' | 'MANGA' | 'GAME' | 'SHOW';
  status: MediaStatus;
  coverUrl: string;
  rating: number; // 1-5
  caption: string;
  durationOrVolumes: number;
  dateCompleted?: string;
}

interface MediaCardProps {
  item: MediaItem;
  onEdit: (id: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onEdit }) => {
  const isManga = item.type === 'MANGA';
  
  return (
    <motion.div 
      onClick={() => onEdit(item.id)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
      className="group relative p-4 rounded-[20px] transition-all duration-300 h-full flex flex-col bg-white shadow-[0_10px_30px_rgba(244,172,183,0.15)] border border-gray-100 hover:shadow-[0_15px_40px_rgba(244,172,183,0.25)] cursor-pointer"
    >
      {/* Tape Effect (Decorative) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-rose-100/50 rotate-[-2deg] backdrop-blur-sm shadow-sm z-10 opacity-80 pointer-events-none" />

      {/* Image Container - Fixed Aspect Ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl mb-4 shadow-inner flex-shrink-0 bg-gray-50 pointer-events-none">
        <img 
          src={item.coverUrl} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2 px-3 py-1 text-[10px] font-bold tracking-widest rounded-full uppercase backdrop-blur-md bg-white/80 text-coquette-text shadow-sm">
           {item.type}
        </div>

        {/* Status Badge */}
        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider backdrop-blur-md border shadow-sm
          ${item.status === 'FINISHED' 
            ? 'bg-rose-400/90 text-white border-rose-300' 
            : 'bg-emerald-50/90 text-emerald-600 border-emerald-100'}
        `}>
          {item.status}
        </div>

        {/* Favorite Heart Overlay */}
        <div className="absolute top-2 right-2 p-2 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
           <Heart className="w-4 h-4 text-white fill-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col text-center pointer-events-none">
         {/* Title - Limit to 1 line with fixed height to ensure uniformity */}
         <div className="h-[28px] mb-1 flex items-center justify-center">
            <h3 className="text-lg font-bold leading-tight line-clamp-1 font-coquette-header text-coquette-text">
              {item.title}
            </h3>
         </div>

         {/* Tracked Duration/Volumes Info */}
         <div className="flex items-center justify-center gap-1.5 mb-2 text-[10px] font-black uppercase tracking-widest text-coquette-subtext">
            {isManga ? <BookOpen className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span>{item.durationOrVolumes} {isManga ? (item.durationOrVolumes === 1 ? 'Vol' : 'Vols') : 'Mins'}</span>
         </div>

         {/* Rating */}
         <div className="flex justify-center gap-1 mb-2">
           {[1, 2, 3, 4, 5].map((star) => (
             <Star 
               key={star} 
               className={`w-3 h-3 
                 ${star <= item.rating 
                   ? 'fill-coquette-gold text-coquette-gold' 
                   : 'text-gray-300'}
               `} 
             />
           ))}
         </div>

         {/* Divider */}
         <div className="w-1/2 h-px mx-auto my-2 bg-coquette-border" />

         {/* Legible One-Liner Caption - Limit to 2 lines fixed height */}
         <div className="h-[40px] flex items-start justify-center overflow-hidden">
            <p className="text-sm leading-relaxed px-2 line-clamp-2 font-coquette-body text-coquette-text/90 italic">
              "{item.caption}"
            </p>
         </div>
         
         <div className="mt-auto pt-3">
            {item.dateCompleted && (
              <p className="text-xs uppercase tracking-widest font-medium opacity-80 text-gray-500 font-coquette-body">
                {/* Fix: use new Date() instead of parseISO */}
                {format(new Date(item.dateCompleted), 'MMM dd yyyy')}
              </p>
            )}
         </div>
      </div>
    </motion.div>
  );
};

export default MediaCard;