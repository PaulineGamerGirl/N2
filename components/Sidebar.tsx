
import React, { useState } from 'react';
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
  VolumeX
} from 'lucide-react';
import { View } from '../types';
import { SIDEBAR_VIDEOS } from '../constants';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onSummonSensei: () => void;
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
        
        {/* Status Indicator Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        
        <div className="absolute bottom-2 right-2 p-1.5 bg-black/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onSummonSensei }) => {
  const navItems = [
    { id: 'dashboard', label: 'My Journal', icon: Feather },
    { id: 'questmap', label: 'Journey Map', icon: Map },
    { id: 'syntax', label: 'Grammar Notes', icon: Scroll },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'inventory', label: 'Keepsakes', icon: Sparkles },
    { id: 'messenger', label: 'Messenger', icon: MessageCircleHeart },
  ];

  return (
    <aside className="w-20 lg:w-64 h-screen flex flex-col fixed left-0 top-0 z-20 transition-all duration-500 bg-[#fffcfc] border-r-4 border-double border-coquette-gold/30 shadow-xl">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-center lg:justify-start space-x-3 border-b border-coquette-border">
         <Sparkles className="w-6 h-6 text-coquette-gold animate-pulse" />
        <span className="hidden lg:block font-bold text-xl tracking-widest font-coquette-header text-coquette-text">
          Study Diary
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 flex flex-col gap-3 px-3">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`flex items-center space-x-4 p-3 rounded-r-full transition-all duration-300 group relative overflow-hidden font-coquette-body
                ${isActive 
                  ? 'bg-coquette-accent/20 text-coquette-text border-l-4 border-coquette-accent' 
                  : 'text-coquette-subtext hover:bg-coquette-bg hover:text-coquette-text hover:pl-5'}
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-coquette-accent fill-coquette-accent/20' : 'group-hover:text-coquette-gold'}`} />
              <span className="hidden lg:block text-lg">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Actions */}
      <div className="p-4 flex flex-col">
        {/* Memories Widget inserted here */}
        <SidebarVideoWidget />

        <button
          onClick={onSummonSensei}
          className="w-full flex items-center justify-center lg:justify-start space-x-3 p-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] bg-white border border-coquette-gold/50 text-coquette-text shadow-[0_4px_10px_rgba(212,163,115,0.2)] hover:shadow-[0_4px_15px_rgba(212,163,115,0.4)] font-coquette-body italic"
        >
          <BookHeart className="w-5 h-5 text-coquette-accent" />
          <span className="hidden lg:block">Consult Guide</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
