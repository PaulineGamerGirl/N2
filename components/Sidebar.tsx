
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map, 
  Sparkles, 
  Database, 
  Feather, 
  BookHeart, 
  Scroll, 
  MessageCircleHeart, 
  Activity,
  Volume2,
  VolumeX,
  Clapperboard,
  PanelLeftClose
} from 'lucide-react';
import { View } from '../types';
import { SIDEBAR_VIDEOS } from '../constants';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onSummonSensei: () => void;
  isHidden?: boolean;
  onToggleHide?: () => void;
}

const SidebarVideoWidget: React.FC = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % SIDEBAR_VIDEOS.length);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="px-4 mb-4 hidden lg:block">
      <div 
        onClick={toggleMute}
        className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-sm group cursor-pointer bg-gray-50"
      >
        <video
          key={SIDEBAR_VIDEOS[currentVideoIndex]}
          src={SIDEBAR_VIDEOS[currentVideoIndex]}
          autoPlay
          muted={isMuted}
          playsInline
          onEnded={handleVideoEnd}
          className="w-full h-full object-cover grayscale-[0.2] sepia-[0.1]"
        />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        
        <div className="absolute bottom-2 right-2 p-1.5 bg-black/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onSummonSensei, isHidden = false, onToggleHide }) => {
  const navItems = [
    { id: 'dashboard', label: 'My Journal', icon: Feather },
    { id: 'questmap', label: 'Journey Map', icon: Map },
    { id: 'theater', label: 'Theater', icon: Clapperboard },
    { id: 'syntax', label: 'Grammar Notes', icon: Scroll },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'inventory', label: 'Keepsakes', icon: Sparkles },
    { id: 'messenger', label: 'Messenger', icon: MessageCircleHeart },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ x: isHidden ? '-100%' : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-20 lg:w-64 h-screen flex flex-col fixed left-0 top-0 z-[60] bg-[#fffcfc] border-r-4 border-double border-coquette-gold/30 shadow-xl"
    >
      <div className="h-[60px] px-4 lg:px-6 flex items-center justify-between border-b border-coquette-border shrink-0">
         <div className="flex items-center space-x-2 overflow-hidden flex-1">
           <Sparkles className="w-5 h-5 text-coquette-gold animate-pulse flex-shrink-0" />
           <span className="hidden lg:block font-bold text-base tracking-widest font-coquette-header text-coquette-text whitespace-nowrap">
             Study Diary
           </span>
         </div>
         <button 
           onClick={onToggleHide}
           className="hidden lg:flex p-1.5 ml-2 rounded-full hover:bg-rose-50 text-rose-200 hover:text-rose-400 transition-all flex-shrink-0"
           title="Hide Sidebar"
         >
           <PanelLeftClose className="w-4 h-4" />
         </button>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onViewChange(item.id as View)}
                className={`w-full flex items-center space-x-4 p-3 rounded-r-full transition-all duration-300 relative overflow-hidden font-coquette-body
                  ${isActive 
                    ? 'bg-coquette-accent/20 text-coquette-text border-l-4 border-coquette-accent' 
                    : 'text-coquette-subtext hover:bg-coquette-bg hover:text-coquette-text hover:pl-5'}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-coquette-accent fill-coquette-accent/20' : 'group-hover:text-coquette-gold'}`} />
                <span className="hidden lg:block text-lg truncate flex-1 text-left">{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      <div className="p-4 flex flex-col">
        <SidebarVideoWidget />

        <button
          onClick={onSummonSensei}
          className="w-full flex items-center justify-center lg:justify-start space-x-3 p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] bg-white border border-coquette-gold/50 text-coquette-text shadow-[0_4px_10px_rgba(212,163,115,0.2)] hover:shadow-[0_4px_15px_rgba(212,163,115,0.4)] font-coquette-body italic"
        >
          <BookHeart className="w-5 h-5 text-coquette-accent" />
          <span className="hidden lg:block">Consult Guide</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
