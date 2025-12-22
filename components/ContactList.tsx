import React from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus } from 'lucide-react';

export interface Contact {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar: string; // URL
  lastMessage: string;
  level: string; // JLPT Level / Vibe
  isOnline?: boolean;
}

interface ContactListProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onAddContact: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, activeContactId, onSelectContact, onAddContact }) => {
  return (
    <div className="flex flex-col h-full bg-[#fffcfc] border-r border-rose-100/50">
      {/* Header */}
      <div className="p-6 border-b border-rose-100 flex items-center justify-between sticky top-0 bg-[#fffcfc]/90 backdrop-blur-sm z-10">
        <h2 className="text-2xl font-bold font-coquette-header text-gray-700">Messages</h2>
        <button 
          onClick={onAddContact}
          className="p-2 rounded-full bg-rose-50 text-rose-400 hover:bg-rose-100 transition-colors shadow-sm"
          title="Create New Persona"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search friends..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-200 text-sm placeholder:text-gray-400 font-coquette-body transition-all outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-rose-200">
        {contacts.map((contact) => {
          const isActive = contact.id === activeContactId;

          return (
            <motion.div
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              whileTap={{ scale: 0.98 }}
              className={`
                group p-3 rounded-[20px] cursor-pointer transition-all duration-300 flex items-center gap-4 relative overflow-hidden
                ${isActive ? 'bg-rose-100 shadow-sm' : 'hover:bg-rose-50/50'}
              `}
            >
              {/* Avatar Container */}
              <div className="relative">
                <motion.div 
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                   <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                </motion.div>
                {/* Status Dot */}
                {contact.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`font-bold text-base truncate font-coquette-header ${isActive ? 'text-rose-900' : 'text-gray-700'}`}>
                    {contact.name}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-rose-300 font-bold">
                    {contact.level.split(' ')[0]} {/* Show N2, N3 etc */}
                  </span>
                </div>
                
                <p className={`text-sm truncate font-coquette-body ${isActive ? 'text-rose-700' : 'text-gray-400 group-hover:text-gray-500'}`}>
                  {contact.lastMessage}
                </p>
              </div>

              {/* Active Indicator Line */}
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-rose-400 rounded-r-full"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactList;