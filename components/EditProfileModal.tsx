
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Sparkles, Image as ImageIcon, Briefcase, BrainCircuit } from 'lucide-react';

export interface PersonaProfile {
  id: string;
  name: string;
  role: string;
  status: string;
  level: string;
  avatar: string;
  systemInstruction: string;
  chips: string[];
  summonVideoUrl?: string;
  summonAudioUrl?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: PersonaProfile;
  onSave: (updatedPersona: PersonaProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, persona, onSave }) => {
  const [formData, setFormData] = useState<PersonaProfile>(persona);

  useEffect(() => {
    setFormData(persona);
  }, [persona]);

  const handleChange = (field: keyof PersonaProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#fffcfc] rounded-[30px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-rose-100"
        >
          {/* Header */}
          <div className="p-6 border-b border-rose-100 bg-rose-50/50 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-rose-400 border border-rose-100 shadow-sm">
                   <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-coquette-header text-gray-800">Edit Persona</h2>
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Customize Your AI Friend</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-rose-400 transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Avatar Preview & URL */}
            <div className="flex gap-4 items-start">
               <img 
                 src={formData.avatar} 
                 alt="Preview" 
                 className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover flex-shrink-0 bg-gray-100" 
               />
               <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                     <ImageIcon className="w-3 h-3" /> Avatar URL
                  </label>
                  <input 
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => handleChange('avatar', e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 text-gray-600 font-mono"
                  />
               </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                     <User className="w-3 h-3" /> Name
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 font-coquette-body font-bold text-gray-700"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                     <Briefcase className="w-3 h-3" /> Role
                  </label>
                  <input 
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 text-gray-600"
                  />
               </div>
            </div>

            {/* System Instruction (The Brain) */}
            <div className="space-y-2 pt-2">
               <label className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3" /> AI Personality / System Instruction
               </label>
               <div className="relative">
                 <textarea 
                    value={formData.systemInstruction}
                    onChange={(e) => handleChange('systemInstruction', e.target.value)}
                    rows={6}
                    className="w-full p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-700 leading-relaxed font-mono resize-none"
                    placeholder="Describe how this character should behave..."
                 />
                 <Sparkles className="absolute right-3 top-3 w-4 h-4 text-rose-300 opacity-50 pointer-events-none" />
               </div>
               <p className="text-[10px] text-gray-400 italic">
                  Tip: Be specific about tone, JLPT level, and speaking style (e.g., "Use Tameguchi").
               </p>
            </div>

          </form>

          {/* Footer */}
          <div className="p-4 border-t border-rose-100 bg-white flex justify-end gap-3">
             <button 
               onClick={onClose}
               className="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-wide"
             >
               Cancel
             </button>
             <button 
               onClick={handleSubmit}
               className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-rose-400 hover:bg-rose-500 shadow-lg shadow-rose-200 transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wide flex items-center gap-2"
             >
               <Save className="w-4 h-4" /> Save Persona
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
