
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants } from '../constants';
import ContactList, { Contact } from './ContactList';
import CorrectionModal, { CorrectionData } from './CorrectionModal';
import EditProfileModal, { PersonaProfile } from './EditProfileModal';
import CreateContactModal from './CreateContactModal';
import { Phone, Video, MoreVertical, Send, Smile, ChevronLeft, Languages, Sparkles, PenLine, Lightbulb, Loader2, Volume2, StopCircle, Play, Square, Target, Map, Swords, Trophy, RefreshCcw, Dice5, LogOut, Dumbbell, Search, GraduationCap, Book, ChevronDown, ChevronRight, LayoutGrid, List, Wand2, X } from 'lucide-react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { useProgressStore } from '../store/progressStore';
import { ParsedGrammarPoint } from '../utils/grammarParser';

// --- HELPERS FOR AUDIO DECODING ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- VOICE MAPPING ---
const VOICE_MAP: Record<string, string> = {
  'hina': 'Kore', 
  'kenji': 'Puck', 
  'luna': 'Zephyr', 
  'director_k': 'Fenrir', 
  'aki': 'Charon', 
  'mission_bot': 'Fenrir', 
  'grammar_drill': 'Charon', 
};

// --- MODULE MAPPING ---
const MODULE_TITLES: Record<string, string> = {
  'genki1': 'Genki I (N5)',
  'genki2': 'Genki II (N4)',
  'quartet1': 'Quartet I (N3)',
  'quartet2': 'Quartet II (N2)',
};

// --- SCENARIO DATA ---
interface MissionScenario {
  id: string;
  title: string;
  difficulty: string; 
  description: string;
  roleName: string; 
  systemInstruction: string;
  initialMessage: string;
}

interface DrillScenarioResponse {
  characterName: string;
  roleDescription: string;
  context: string;
  systemInstruction: string;
  initialMessage: string;
}

const DEFAULT_MISSION_SCENARIOS: MissionScenario[] = [
  {
    id: 'broken_order',
    title: 'The Broken Order',
    difficulty: 'N4',
    description: 'You ordered coffee but got tea. Explain the mistake to the waiter.',
    roleName: 'Waiter',
    systemInstruction: `Roleplay as a polite but slightly confused Japanese waiter.
    The customer (user) ordered coffee, but you accidentally brought tea.
    If the user points out the mistake politely, apologize profusely and offer to change it.
    If they are rude, become flustered.
    Speak in Desu/Masu form (Teineigo).`,
    initialMessage: 'お待たせいたしました。ホットティーでございます。'
  },
  {
    id: 'lost_wallet',
    title: 'The Lost Wallet',
    difficulty: 'N3',
    description: 'You lost your wallet at a train station. Describe it to the station master.',
    roleName: 'Station Master',
    systemInstruction: `Roleplay as a serious Japanese Station Master.
    The user has lost their wallet. Ask for details: color, brand, contents, and where they might have dropped it.
    Speak in professional, standard polite Japanese.
    Do not find the wallet immediately. Make them describe it well first.`,
    initialMessage: 'はい、駅長室です。どうされましたか？'
  },
  {
    id: 'casual_party',
    title: 'Casual Party',
    difficulty: 'N2',
    description: 'A stranger talks to you at a party. Keep the conversation going for 5 turns.',
    roleName: 'Friendly Stranger',
    systemInstruction: `Roleplay as a friendly stranger at a house party in Tokyo.
    Speak in casual, slangy Japanese (Tameguchi).
    Ask the user how they know the host, what they do, etc.
    React naturally to their answers.`,
    initialMessage: 'あれ？見ない顔だね。タカシの友達？'
  }
];

const DEFAULT_CONTACTS: Record<string, PersonaProfile> = {
  'mission_bot': {
    id: 'mission_bot',
    name: 'Mission Control',
    role: 'Training',
    status: 'Standby',
    level: 'Various',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=MissionBot&backgroundColor=e5e7eb&clothing=blazerAndShirt&clothingColor=000000',
    systemInstruction: 'Select a mission to begin.',
    chips: []
  },
  'grammar_drill': {
    id: 'grammar_drill',
    name: 'Grammar Dojo',
    role: 'Sensei',
    status: 'Open',
    level: 'Adaptive',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SenseiDojo&backgroundColor=fecaca&clothing=shirtVNeck&clothingColor=5c4d49',
    systemInstruction: 'Select a grammar point to drill.',
    chips: []
  },
  'hina': {
    id: 'hina',
    name: 'Hina',
    role: 'Bestie',
    status: 'Online',
    level: 'N3 Casual',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Hina&backgroundColor=ffdfbf&clothing=collarAndSweater&clothingColor=ffafb9',
    systemInstruction: `Roleplay as Hina, a 21yo female student. 
    Speak in Casual Japanese (Tameguchi). 
    Tone: High energy, friendly, uses slang and 'w' for LOL.
    If the user asks 'Why', explain based on previous context in the chat history.
    Never use English in the 'reply' field. Use emojis freely.`,
    chips: ["Ask about the cafe", "Share latest gossip", "Discuss homework", "Ask about anime"],
    summonVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-studying-with-headphones-43033-large.mp4'
  },
  'kenji': {
    id: 'kenji',
    name: 'Kenji',
    role: 'Gamer Friend',
    status: 'Playing Elden Ring',
    level: 'N2 Enthusiastic',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Kenji&backgroundColor=c0aede&clothing=hoodie&clothingColor=3c4f76',
    systemInstruction: `Roleplay as Kenji. 
    Speak in Masculine/Rough Casual Japanese. 
    Tone: Enthusiastic, uses gaming slang (nerf, buff, meta).
    Never use English in the 'reply' field.`,
    chips: ["Ask about Elden Ring", "Discuss game updates", "Invite to Discord", "Ask if free"],
    summonVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-man-gaming-at-night-42866-large.mp4'
  },
  'luna': {
    id: 'luna',
    name: 'Luna',
    role: 'Theorist',
    status: 'Reading...',
    level: 'N2 Intellectual',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna&backgroundColor=b6e3f4&clothing=shirtCrewNeck&clothingColor=262e33',
    systemInstruction: `Roleplay as Luna. 
    Speak in Intellectual/Written Style (Dearu/Desu). 
    Tone: Calm, mysterious, discusses abstract concepts.
    Never use English in the 'reply' field.`,
    chips: ["Ask about the book", "Discuss philosophy", "Comment on the rain", "Ask about dreams"],
    summonVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-reading-a-book-by-the-window-41584-large.mp4'
  },
  'director_k': {
    id: 'director_k',
    name: 'Director K',
    role: 'Senpai',
    status: 'In a meeting',
    level: 'N1 Keigo',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=DirectorK&backgroundColor=d1d4f9&clothing=blazerAndShirt&clothingColor=25557c',
    systemInstruction: `Roleplay as Director K. 
    Speak in Formal Business Japanese (Sonkeigo/Kenjougo). 
    Tone: Cold, professional, strict.
    Correct the user if they are rude or too casual.
    Never use English in the 'reply' field.`,
    chips: ["Submit report", "Apologize for delay", "Ask about meeting", "Confirm schedule"],
    summonVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-thoughtful-man-sitting-in-a-office-42775-large.mp4'
  },
  'aki': {
    id: 'aki',
    name: 'Aki',
    role: 'Partner',
    status: 'Online',
    level: 'Native Stoic',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aki&backgroundColor=e6e6e6&clothing=shirtVNeck&clothingColor=5199e4',
    systemInstruction: `Roleplay as Aki. 
    Speak in Short, Masculine, Caring Casual Japanese. 
    Tone: Stoic but protective. Use 'Ore' (俺).
    Do not be overly polite. Do not use many emojis.
    Never use English in the 'reply' field.`,
    chips: ["Ask about dinner", "Ask how work was", "Plan weekend date", "Say you're tired"],
    summonVideoUrl: '/aki_summon.mp4'
  }
};

interface Message {
  id: string;
  sender: 'user' | 'persona';
  text: string;
  timestamp: string;
  createdAt?: number; 
  correction?: CorrectionData;
}

interface AIResponse {
  reply: string;
  suggestions: string[];
}

// --- SUB-COMPONENT: SUMMON OVERLAY ---
const SummonOverlay: React.FC<{ persona: PersonaProfile; onComplete: () => void }> = ({ persona, onComplete }) => {
  useEffect(() => {
    if (persona.summonAudioUrl) {
      const audio = new Audio(persona.summonAudioUrl);
      audio.play().catch(e => console.warn("Audio autoplay blocked", e));
    }

    // High Safety Fallback: 60 seconds (allows full cinematic but prevents hang)
    const safetyTimer = setTimeout(() => {
      onComplete();
    }, 60000);

    return () => clearTimeout(safetyTimer);
  }, [persona, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onClick={onComplete}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
    >
      {/* 90% Cinematic Video Window */}
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative w-[90vw] h-[90vh] overflow-hidden rounded-lg shadow-[0_0_100px_rgba(0,0,0,1)] bg-black border border-white/5"
      >
        {persona.summonVideoUrl ? (
          <video 
            src={persona.summonVideoUrl}
            autoPlay
            muted={false}
            playsInline
            onEnded={onComplete}
            onError={(e) => {
              console.error("Summon video error:", e);
              onComplete();
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
             <motion.div 
               animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0, -5, 0] }} 
               transition={{ duration: 10, repeat: Infinity }}
               className="w-[80vw] h-[80vw] bg-pink-200/20 rounded-full blur-[100px]"
             />
             <h1 className="text-6xl md:text-8xl font-black text-black font-coquette-header italic tracking-[0.2em] uppercase z-20">
               {persona.name}
             </h1>
          </div>
        )}

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      </motion.div>

      {/* Screen-Wide Deep Black Borders (outside 90% box) */}
      <div className="absolute top-0 left-0 right-0 h-[5vh] bg-black z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-[5vh] bg-black z-10" />
      <div className="absolute top-0 left-0 bottom-0 w-[5vw] bg-black z-10" />
      <div className="absolute top-0 right-0 bottom-0 w-[5vw] bg-black z-10" />

      {/* Intro Flash */}
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 bg-white z-50 pointer-events-none"
      />
    </motion.div>
  );
};

// --- HELPER: SYSTEM INSTRUCTION RESOLVER ---
const resolveSystemInstruction = (contact: PersonaProfile): string => {
  const isDrill = contact.id === 'grammar_drill';
  const isMission = contact.id === 'mission_bot';

  let behaviorInstruction = "";

  if (isDrill) {
    behaviorInstruction = `
      ${contact.systemInstruction}
      
      --- MODE: GRAMMAR DRILL ---
      1. CRITICAL: If the student makes a mistake, EXPLAIN IT IN ENGLISH first, then provide the JAPANESE correction.
      2. If the student is correct, continue the roleplay in JAPANESE.
      3. Maintain the persona defined above.
    `;
  } else if (isMission) {
    behaviorInstruction = `
      ${contact.systemInstruction}
      
      --- MODE: MISSION SCENARIO ---
      1. You are roleplaying as a specific character in a specific situation.
      2. Speak naturally in JAPANESE.
      3. Do NOT break character.
    `;
  } else {
    behaviorInstruction = `
      ${contact.systemInstruction}
      
      --- MODE: STANDARD CHAT ---
      1. You are ${contact.name}. Act exactly as described in your persona.
      2. LANGUAGE RULE: Speak ONLY in JAPANESE. 
      3. Do NOT use English in the 'reply' field.
      4. Do NOT use Romaji.
      5. Do NOT explain grammar rules unless explicitly asked.
    `;
  }

  return `
    ${behaviorInstruction}

    --- TASK: CONTEXT SUGGESTIONS (ENGLISH ONLY) ---
    Analyze the conversation flow and provide 3 suggestions for what the user *could* say next.
    - These suggestions must be in ENGLISH (Imperative commands).
    - Example: "Ask about the weather", "Decline politely", "Change topic to food".

    --- OUTPUT FORMAT ---
    Return a JSON object with this exact schema:
    {
      "reply": "(String) Your Japanese response",
      "suggestions": ["(String) Suggestion 1", " (String) Suggestion 2", "(String) Suggestion 3"]
    }
  `;
};

const generateGeminiResponse = async (
  systemInstruction: string, 
  history: Message[], 
  userText: string
): Promise<AIResponse> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return {
      reply: "API Key Missing (Check Environment)",
      suggestions: ["Check API Key", "Retry connection"]
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const pastContents = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const currentContent = {
    role: 'user',
    parts: [{ text: userText }]
  };

  const contents = [...pastContents, currentContent];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction, 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["reply", "suggestions"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIResponse;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      reply: "申し訳ありません、ちょっと聞こえなかった。(Connection Error)",
      suggestions: ["Retry", "Check connection", "Say hello"]
    };
  }
};

const analyzeGrammar = async (text: string): Promise<CorrectionData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a helpful Japanese language teacher. 
    Analyze the following student sentence: "${text}"

    Tasks:
    1. Identify if it is natural. 
    2. If it is unnatural, a fragment, or incorrect slang, provide a better native phrasing.
    3. Explain the reason for the correction in English.

    OUTPUT FORMAT: RAW JSON ONLY (No Markdown)
    {
      "original": "${text}",
      "better": "Native/Correct phrasing (Kanji/Kana)",
      "reason": "Clear explanation of the error or nuance in English"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            better: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["original", "better", "reason"]
        }
      }
    });

    const rawText = response.text || "{}";
    const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(cleanText);

    return {
      original: json.original || text,
      corrected: json.better || "Natural phrasing not found.",
      explanation: json.reason || "No explanation provided."
    };

  } catch (error) {
    console.error("Grammar Analysis Error:", error);
    return {
      original: text,
      corrected: "Error during analysis",
      explanation: "Could not process the grammar check. Please try again."
    };
  }
};

const generateDrillScenario = async (point: ParsedGrammarPoint): Promise<DrillScenarioResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert Japanese teacher. The student's name is Pauline.
    Target Grammar: "${point.point}"
    Meaning: "${point.meaning}"

    Create a short, unique roleplay scenario to practice this grammar.

    Requirements:
    1. Define a Persona (Name, Role, Personality).
    2. Define a Context.
    3. System Instruction for the AI:
       - You are roleplaying as the defined Persona.
       - Speak natural Japanese consistent with the persona.
       - Address the student as Pauline (Pauline-san, etc).
       - Guide the conversation so Pauline MUST use "${point.point}".
       - CORRECTION RULE: If Pauline makes a mistake or uses the target grammar incorrectly:
         a) Explain the error AND the grammar rule in ENGLISH (so she understands why).
         b) Provide the corrected JAPANESE sentence.
         c) IMMEDIATELY switch back to the Roleplay Persona and ask a follow-up question in JAPANESE to continue the scene.
    4. Initial Message: Start the roleplay in Japanese, addressing Pauline.

    Output strictly valid JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characterName: { type: Type.STRING, description: "The name of the persona (e.g. Tanaka-san)" },
          roleDescription: { type: Type.STRING, description: "Short description of role (e.g. Strict Teacher)" },
          context: { type: Type.STRING },
          systemInstruction: { type: Type.STRING },
          initialMessage: { type: Type.STRING }
        },
        required: ["characterName", "roleDescription", "context", "systemInstruction", "initialMessage"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as DrillScenarioResponse;
  }
  throw new Error("Failed to generate drill scenario");
};


const MessengerTab: React.FC = () => {
  // --- STATE ---
  const [contacts, setContacts] = useState<Record<string, PersonaProfile>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('messenger_contacts');
        const parsed = saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
        const updated = { ...parsed };
        if (!updated['mission_bot']) updated['mission_bot'] = DEFAULT_CONTACTS['mission_bot'];
        if (!updated['grammar_drill']) updated['grammar_drill'] = DEFAULT_CONTACTS['grammar_drill'];
        return updated;
      } catch (e) {
        return DEFAULT_CONTACTS;
      }
    }
    return DEFAULT_CONTACTS;
  });

  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isSummoning, setIsSummoning] = useState(false);
  const [pendingContactId, setPendingContactId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('messenger_history');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({}); 

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [analyzingMessageId, setAnalyzingMessageId] = useState<string | null>(null);

  const [correctionData, setCorrectionData] = useState<CorrectionData | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- TRANSLATOR STATE ---
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatorResult, setTranslatorResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // --- PERSISTENT OUTPUT TIMER STATE ---
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    const updateTimerDisplay = () => {
      const startTime = localStorage.getItem('messenger_session_start');
      if (startTime) {
        setIsTimerRunning(true);
        const duration = Math.floor((Date.now() - Number(startTime)) / 1000);
        setDisplaySeconds(Math.max(0, duration));
      } else {
        setIsTimerRunning(false);
        setDisplaySeconds(0);
      }
    };

    updateTimerDisplay();
    const interval = setInterval(updateTimerDisplay, 1000);
    return () => clearInterval(interval);
  }, []);

  const [activeMission, setActiveMission] = useState<MissionScenario | null>(null);
  const [scenarios, setScenarios] = useState<MissionScenario[]>(DEFAULT_MISSION_SCENARIOS);
  const [isGeneratingMissions, setIsGeneratingMissions] = useState(false);

  const [activeDrill, setActiveDrill] = useState<ParsedGrammarPoint | null>(null);
  const [isGeneratingDrill, setIsGeneratingDrill] = useState(false);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const { grammarDatabase, addActivityLog } = useProgressStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- DERIVED DATA ---
  const activeContact = activeContactId ? contacts[activeContactId] : null;
  const currentMessages = activeContactId ? (messages[activeContactId] || []) : [];

  const contactListData: Contact[] = Object.values(contacts).map((p: PersonaProfile) => {
    const chat = messages[p.id] || [];
    const lastMsg = chat.length > 0 ? chat[chat.length - 1].text : '...';
    return {
      id: p.id,
      name: p.name,
      role: p.role,
      status: p.status,
      level: p.level,
      avatar: p.avatar,
      lastMessage: lastMsg,
      isOnline: p.id === 'hina' || p.id === 'aki'
    };
  }).sort((a, b) => {
    if (a.id === 'mission_bot') return -1;
    if (b.id === 'mission_bot') return 1;
    if (a.id === 'grammar_drill') return -1;
    if (b.id === 'grammar_drill') return 1;
    return 0;
  });

  const groupedGrammar = React.useMemo(() => {
    const groups: Record<string, { id: string, title: string, chapters: { id: string, title: string, points: ParsedGrammarPoint[] }[] }> = {};
    const db = grammarDatabase as Record<string, ParsedGrammarPoint[]>;

    Object.entries(db).forEach(([key, points]) => {
        if (!points || points.length === 0) return;
        const parts = key.split('_');
        if (parts.length < 2) return;
        const modId = parts[0];
        const chapNum = parts[1];
        if (!groups[modId]) {
            groups[modId] = { 
                id: modId, 
                title: MODULE_TITLES[modId] || modId.toUpperCase(), 
                chapters: [] 
            };
        }
        groups[modId].chapters.push({
            id: key,
            title: `Chapter ${chapNum}`,
            points: points
        });
    });

    const order = ['genki1', 'genki2', 'quartet1', 'quartet2'];
    const sortedBooks = order.map(id => groups[id]).filter(Boolean);
    Object.keys(groups).forEach(id => {
        if (!order.includes(id)) sortedBooks.push(groups[id]);
    });

    sortedBooks.forEach(book => {
        book.chapters.sort((a, b) => {
            const numA = parseInt(a.id.split('_')[1] || '0');
            const numB = parseInt(b.id.split('_')[1] || '0');
            return numA - numB;
        });
    });

    return sortedBooks;
  }, [grammarDatabase]);

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('messenger_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      localStorage.setItem('messenger_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping, activeMission, activeDrill]);

  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // --- HANDLERS ---
  const handleContactSelect = (id: string) => {
    if (id === activeContactId || !id) {
      setActiveContactId(id);
      return;
    }

    const isBot = id === 'mission_bot' || id === 'grammar_drill';
    if (isBot) {
      setActiveContactId(id);
      return;
    }

    // Trigger Summon Sequence
    setPendingContactId(id);
    setIsSummoning(true);
  };

  const handleSummonComplete = () => {
    if (pendingContactId) {
      setActiveContactId(pendingContactId);
    }
    setIsSummoning(false);
    setPendingContactId(null);
  };

  const handleCreateContact = (newPersona: PersonaProfile) => {
    setContacts(prev => ({ ...prev, [newPersona.id]: newPersona }));
    handleContactSelect(newPersona.id);
  };

  const handleSaveProfile = (updatedPersona: PersonaProfile) => {
    setContacts(prev => ({
      ...prev,
      [updatedPersona.id]: updatedPersona
    }));
  };

  const handleStartMission = (mission: MissionScenario) => {
    setActiveMission(mission);
    setContacts(prev => ({
        ...prev,
        'mission_bot': {
            ...prev['mission_bot'],
            name: `Role: ${mission.roleName}`,
            systemInstruction: mission.systemInstruction, 
            status: `Mission: ${mission.title}`,
        }
    }));
    setMessages(prev => ({
        ...prev,
        'mission_bot': [{
            id: `mission_init_${Date.now()}`,
            sender: 'persona',
            text: mission.initialMessage,
            timestamp: 'Just now',
            createdAt: Date.now()
        }]
    }));
  };

  const handleEndMission = () => {
    setActiveMission(null);
    setContacts(prev => ({ ...prev, 'mission_bot': DEFAULT_CONTACTS['mission_bot'] }));
  };

  const handleSelectDrill = async (point: ParsedGrammarPoint) => {
    setActiveDrill(point);
    setIsGeneratingDrill(true);
    try {
        const scenario = await generateDrillScenario(point);
        setContacts(prev => ({
            ...prev,
            'grammar_drill': {
                ...prev['grammar_drill'],
                name: scenario.characterName, 
                role: 'Drill Partner',
                status: `Drill: ${point.point}`, 
                systemInstruction: scenario.systemInstruction,
                avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${scenario.characterName}&backgroundColor=c0aede` 
            }
        }));
        setMessages(prev => ({
            ...prev,
            'grammar_drill': [{
                id: `drill_init_${Date.now()}`,
                sender: 'persona',
                text: scenario.initialMessage,
                timestamp: 'Just now',
                createdAt: Date.now()
            }]
        }));
        setActiveContactId('grammar_drill');
    } catch (e) {
        setContacts(prev => ({
            ...prev,
            'grammar_drill': {
                ...prev['grammar_drill'],
                name: 'Grammar Dojo',
                systemInstruction: `You are a strict teacher. Help Pauline practice ${point.point}.`,
                status: 'Error: Fallback Mode'
            }
        }));
        setMessages(prev => ({
            ...prev,
            'grammar_drill': [{
                id: `drill_fallback_${Date.now()}`,
                sender: 'persona',
                text: `Simulation failed to load. Let's practice ${point.point} freely.`,
                timestamp: 'Just now',
                createdAt: Date.now()
            }]
        }));
        setActiveContactId('grammar_drill');
    } finally {
        setIsGeneratingDrill(false);
    }
  };

  const handleEndDrill = () => {
    setActiveDrill(null);
    setContacts(prev => ({ ...prev, 'grammar_drill': DEFAULT_CONTACTS['grammar_drill'] }));
  };
  
  const toggleBook = (bookId: string) => setExpandedBookId(prev => prev === bookId ? null : bookId);
  const toggleChapter = (chapterId: string) => setExpandedChapterId(prev => prev === chapterId ? null : chapterId);

  const generateNewScenarios = async () => {
    if (!process.env.API_KEY) { alert("API Key missing"); return; }
    setIsGeneratingMissions(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate 3 unique Japanese roleplay learning scenarios... [JSON Array]`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      if (response.text) setScenarios(JSON.parse(response.text));
    } catch (e) { console.error(e); } finally { setIsGeneratingMissions(false); }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeContactId || !activeContact) return;
    const userText = inputValue;
    const contactId = activeContactId;
    setInputValue('');
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: userText, timestamp: 'Just now', createdAt: Date.now() };
    const historySnapshot = messages[contactId] || [];
    setMessages(prev => ({ ...prev, [contactId]: [...(prev[contactId] || []), userMsg] }));
    setIsTyping(true);
    const aiResponse = await generateGeminiResponse(resolveSystemInstruction(activeContact), historySnapshot, userText);
    setIsTyping(false);
    setMessages(prev => {
      const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'persona', text: aiResponse.reply, timestamp: 'Just now', createdAt: Date.now() };
      return { ...prev, [contactId]: [...(prev[contactId] || []), aiMsg] };
    });
    if (aiResponse.suggestions?.length > 0) setContacts(prev => ({ ...prev, [contactId]: { ...prev[contactId], chips: aiResponse.suggestions } }));
  };

  const handleNudgeAI = async () => {
    if (!activeContactId || !activeContact || isTyping) return;
    setIsTyping(true);
    const historySnapshot = messages[activeContactId] || [];
    const lastMsg = historySnapshot[historySnapshot.length - 1];
    let prompt = "";
    if (!lastMsg) prompt = "The user hasn't said anything yet. Greet them warmly to start the conversation.";
    else {
        const now = Date.now();
        const lastTime = lastMsg.createdAt || (now - 1000 * 60 * 60 * 5); 
        const hoursPassed = (now - lastTime) / (1000 * 60 * 60);
        if (hoursPassed > 4) prompt = "It has been a few hours since we last spoke. Acknowledge the time gap, and propose a NEW topic.";
        else prompt = "The user is listening right now. Continue your previous train of thought or add a follow-up question.";
    }
    const aiResponse = await generateGeminiResponse(resolveSystemInstruction(activeContact), historySnapshot, prompt);
    setIsTyping(false);
    setMessages(prev => {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'persona', text: aiResponse.reply, timestamp: 'Just now', createdAt: Date.now() };
        return { ...prev, [activeContactId]: [...(prev[activeContactId] || []), aiMsg] };
    });
    if (aiResponse.suggestions?.length > 0) setContacts(prev => ({ ...prev, [activeContactId]: { ...prev[activeContactId], chips: aiResponse.suggestions } }));
  };

  const playAudioData = async (base64: string, msgId: string) => {
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const audioBuffer = await decodeAudioData(decode(base64), ctx);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { setSpeakingMessageId(null); currentSourceRef.current = null; };
        source.start();
        currentSourceRef.current = source;
        setSpeakingMessageId(msgId);
    } catch (e) { console.error(e); }
  };

  const speakText = async (text: string, personaId: string, msgId: string) => {
    if (speakingMessageId === msgId) {
       if (currentSourceRef.current) try { currentSourceRef.current.stop(); } catch(e) {}
       setSpeakingMessageId(null); return;
    }
    if (!process.env.API_KEY) return;
    if (currentSourceRef.current) try { currentSourceRef.current.stop(); } catch(e) {}
    setSpeakingMessageId(null);
    if (audioCache[msgId]) { playAudioData(audioCache[msgId], msgId); return; }
    setLoadingAudioId(msgId);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const voiceName = VOICE_MAP[personaId] || 'Puck';
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } }
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) { setAudioCache(prev => ({ ...prev, [msgId]: base64Audio })); await playAudioData(base64Audio, msgId); }
    } catch (e) { console.error(e); } finally { setLoadingAudioId(null); }
  };

  const handleAnalyzeGrammarClick = async (msg: Message) => {
    if (msg.correction) { setCorrectionData(msg.correction); setIsCorrectionOpen(true); return; }
    if (!activeContactId) return;
    setAnalyzingMessageId(msg.id);
    try {
      const result = await analyzeGrammar(msg.text);
      setMessages(prev => {
        const chat = (prev[activeContactId] || []).map(m => m.id === msg.id ? { ...m, correction: result } : m);
        return { ...prev, [activeContactId]: chat };
      });
      setCorrectionData(result); setIsCorrectionOpen(true);
    } catch (e) { console.error(e); } finally { setAnalyzingMessageId(null); }
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      // Stop
      const startTime = Number(localStorage.getItem('messenger_session_start'));
      const sessionSeconds = Math.floor((Date.now() - startTime) / 1000);

      if (sessionSeconds >= 60) {
        addActivityLog({
          timestamp: Date.now(),
          category: 'OUTPUT',
          durationMinutes: Math.floor(sessionSeconds / 60),
          summary: `Output Practice with ${activeContact?.name || 'Persona'}`
        });
      }

      const total = Number(localStorage.getItem('messenger_total_time') || 0);
      localStorage.setItem('messenger_total_time', (total + sessionSeconds).toString());
      localStorage.removeItem('messenger_session_start');
      window.dispatchEvent(new Event('storage-update'));
      setIsTimerRunning(false);
      setDisplaySeconds(0);
    } else {
      // Start
      localStorage.setItem('messenger_session_start', Date.now().toString());
      setIsTimerRunning(true);
      window.dispatchEvent(new Event('storage-update'));
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTranslate = async () => {
    if (!translatorInput.trim() || !process.env.API_KEY) return;
    setIsTranslating(true);
    setTranslatorResult('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: translatorInput,
        config: {
          systemInstruction: "You are a precise translation tool. Translate the following Japanese text into natural English. Provide ONLY the translation, no conversational filler."
        }
      });
      setTranslatorResult(response.text || 'Translation failed.');
    } catch (e) {
      console.error(e);
      setTranslatorResult("Error: Could not translate.");
    } finally {
      setIsTranslating(false);
    }
  };

  const isMissionMode = activeContactId === 'mission_bot';
  const isDrillMode = activeContactId === 'grammar_drill';
  const showMissionSelector = isMissionMode && !activeMission;
  const showDrillSelector = isDrillMode && !activeDrill;
  const showChat = activeContactId && !showMissionSelector && !showDrillSelector;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full h-full flex overflow-hidden bg-rose-50 rounded-[30px] border border-rose-100 shadow-xl max-w-[1600px] mx-auto relative">
      
      {/* --- SUMMON OVERLAY --- */}
      <AnimatePresence>
        {isSummoning && pendingContactId && contacts[pendingContactId] && (
          <SummonOverlay 
            persona={contacts[pendingContactId]} 
            onComplete={handleSummonComplete}
          />
        )}
      </AnimatePresence>

      <div className={`${activeContactId ? 'hidden lg:flex' : 'flex'} w-full lg:w-[30%] flex-col h-full bg-[#fffcfc] z-10`}>
        <ContactList contacts={contactListData} activeContactId={activeContactId} onSelectContact={handleContactSelect} onAddContact={() => setIsCreateModalOpen(true)} />
      </div>
      <div className={`${!activeContactId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[70%] h-full bg-white relative overflow-hidden`}>
        <AnimatePresence mode="wait">
        {activeContact ? (
          <motion.div 
            key={activeContact.id}
            initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 flex flex-col h-full"
          >
            {showMissionSelector && (
                <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                    <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-white sticky top-0 z-20">
                         <div className="flex items-center gap-3">
                             <button onClick={() => handleContactSelect('')} className="lg:hidden p-2 -ml-2 text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
                             <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-200"><Target className="w-5 h-5 text-gray-500" /></div>
                             <div><h3 className="text-xl font-bold font-coquette-header text-gray-800">Mission Control</h3><p className="text-xs font-bold uppercase tracking-wider text-rose-400">Select Scenario</p></div>
                         </div>
                         <button onClick={generateNewScenarios} disabled={isGeneratingMissions} className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-500 font-bold text-xs transition-all shadow-sm disabled:opacity-50">
                            {isGeneratingMissions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dice5 className="w-4 h-4" />}{isGeneratingMissions ? "Generating..." : "New Missions"}
                         </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {scenarios.map(mission => (
                                <div key={mission.id} className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                                    <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-white tracking-widest ${mission.difficulty.includes('N5') || mission.difficulty.includes('N4') ? 'bg-green-400' : mission.difficulty.includes('N3') ? 'bg-yellow-400' : 'bg-red-400'}`}>{mission.difficulty}</div>
                                    <div className="mb-4"><div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform"><Swords className="w-6 h-6" /></div><h3 className="font-bold text-lg text-gray-800 font-coquette-header leading-tight mb-1">{mission.title}</h3><p className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">Role: {mission.roleName}</p></div>
                                    <p className="text-sm text-gray-600 mb-6 flex-1 leading-relaxed">{mission.description}</p>
                                    <button onClick={() => handleStartMission(mission)} className="w-full py-3 rounded-xl border-2 border-rose-100 font-bold text-rose-400 hover:bg-rose-400 hover:text-white transition-all uppercase tracking-wide text-xs shadow-sm hover:shadow-md">Start Mission</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {showDrillSelector && (
               <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                   <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-white sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleContactSelect('')} className="lg:hidden p-2 -ml-2 text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-200 text-rose-400"><Dumbbell className="w-5 h-5" /></div>
                            <div><h3 className="text-xl font-bold font-coquette-header text-gray-800">Grammar Dojo</h3><p className="text-xs font-bold uppercase tracking-wider text-rose-400">Select Drill Target</p></div>
                        </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 relative">
                       <AnimatePresence>{isGeneratingDrill && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center"><div className="relative"><div className="w-20 h-20 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-8 h-8 text-rose-400 animate-pulse" /></div></div><h3 className="mt-6 text-xl font-bold font-coquette-header text-gray-800 animate-pulse">Constructing Simulation</h3><p className="text-sm text-rose-400 font-bold uppercase tracking-widest mt-2">Generating Persona...</p></motion.div> )}</AnimatePresence>
                       {groupedGrammar.length === 0 ? ( <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4"><GraduationCap className="w-12 h-12 opacity-20" /><p>No grammar notes found.</p></div> ) : ( <div className="max-w-4xl mx-auto space-y-4">{groupedGrammar.map(book => ( <div key={book.id} className="border border-rose-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md"><button onClick={() => toggleBook(book.id)} className="w-full flex items-center justify-between p-5 bg-white hover:bg-rose-50/30 transition-colors"><div className="flex items-center gap-4"><div className={`p-2 rounded-lg transition-colors ${expandedBookId === book.id ? 'bg-rose-100 text-rose-500' : 'bg-gray-50 text-gray-400'}`}><Book className="w-5 h-5" /></div><div className="text-left"><h3 className="font-bold text-lg text-gray-800 font-coquette-header">{book.title}</h3><p className="text-xs text-gray-400 uppercase tracking-widest font-bold">{book.chapters.length} Chapters</p></div></div>{expandedBookId === book.id ? <ChevronDown className="w-5 h-5 text-rose-400" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}</button><AnimatePresence>{expandedBookId === book.id && ( <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-rose-50 bg-rose-50/10"><div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">{book.chapters.map(chap => ( <div key={chap.id} className="bg-white border border-rose-100 rounded-xl overflow-hidden"><button onClick={() => toggleChapter(chap.id)} className={`w-full flex items-center justify-between p-3 px-4 transition-colors ${expandedChapterId === chap.id ? 'bg-rose-50 text-rose-600' : 'hover:bg-gray-50 text-gray-600'}`}><div className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 opacity-50" /><span className="font-bold text-sm font-coquette-body">{chap.title}</span></div><div className="flex items-center gap-2"><span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold">{chap.points.length}</span>{expandedChapterId === chap.id ? <ChevronDown className="w-3 h-3 opacity-50" /> : <ChevronRight className="w-3 h-3 opacity-50" />}</div></button><AnimatePresence>{expandedChapterId === chap.id && ( <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-gray-100 bg-gray-50/50"><ul className="divide-y divide-gray-100">{chap.points.map(pt => ( <li key={pt.id}><button onClick={() => handleSelectDrill(pt)} disabled={isGeneratingDrill} className="w-full text-left p-3 pl-10 hover:bg-white hover:text-rose-500 transition-colors flex items-center gap-3 group disabled:opacity-50"><div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-rose-400" /><div className="flex-1"><div className="font-bold text-sm text-gray-700 group-hover:text-rose-600">{pt.point}</div><div className="text-xs text-gray-400 truncate">{pt.meaning}</div></div><Play className="w-3 h-3 opacity-0 group-hover:opacity-100 text-rose-400" /></button></li> ))}</ul></motion.div> )}</AnimatePresence></div> ))}</div></motion.div> )}</AnimatePresence></div> ))}</div> )}
                   </div>
               </div>
            )}
            {showChat && (
            <>
            <div className="px-6 py-4 border-b border-rose-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
               <div className="flex items-center gap-4">
                  <button onClick={() => handleContactSelect('')} className="lg:hidden p-2 -ml-2 text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
                  <div className="relative group cursor-pointer" onClick={() => !isMissionMode && !isDrillMode && setIsEditProfileOpen(true)}><img src={activeContact.avatar} alt={activeContact.name} className="w-12 h-12 rounded-full border border-rose-200 shadow-sm object-cover" />{!isMissionMode && !isDrillMode && <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><PenLine className="w-4 h-4 text-white" /></div>}</div>
                  <div><div className="flex items-center gap-2"><h3 className="text-lg font-bold font-coquette-header text-gray-800">{activeContact.name}</h3>{!isMissionMode && !isDrillMode && <button onClick={() => setIsEditProfileOpen(true)} className="p-1 rounded-full text-gray-300 hover:text-rose-400 transition-colors"><PenLine className="w-3.5 h-3.5" /></button>}</div><p className="text-xs text-rose-400 font-bold uppercase tracking-wider">{activeContact.status}</p></div>
               </div>
               <div className="flex gap-2 items-center">
                  {(isMissionMode && activeMission) && <button onClick={handleEndMission} className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border border-transparent"><LogOut className="w-3 h-3" /> Quit</button>}
                  {(isDrillMode && activeDrill) && <button onClick={handleEndDrill} className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border border-transparent"><LogOut className="w-3 h-3" /> End</button>}
                  <button onClick={toggleTimer} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all duration-300 shadow-sm ${isTimerRunning ? 'bg-red-50 text-red-500 border border-red-200 animate-pulse' : 'bg-rose-50 text-rose-400 border border-rose-100 hover:bg-rose-100'}`}>{isTimerRunning ? <><Square className="w-3 h-3 fill-current" /><span className="font-mono text-sm">{formatTime(displaySeconds)}</span></> : <><Play className="w-3 h-3 fill-current" /><span>Output Practice</span></>}</button>
                  <button className="p-3 rounded-full hover:bg-rose-50 text-rose-300"><Phone className="w-5 h-5" /></button><button className="p-3 rounded-full hover:bg-rose-50 text-rose-300"><Video className="w-5 h-5" /></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-rose-50/30 relative">
               <AnimatePresence>
                 {isTranslatorOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 20, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.95 }}
                     className="absolute bottom-6 left-6 right-6 z-40 bg-white rounded-[32px] shadow-2xl border border-rose-100 p-7 flex flex-col gap-5 overflow-hidden"
                   >
                     <div className="flex items-center justify-between border-b border-rose-50 pb-4">
                        <div className="flex items-center gap-2.5">
                           <Languages className="w-5 h-5 text-rose-400" />
                           <h4 className="font-bold font-coquette-header text-gray-700 tracking-wide text-lg">Quick Translator</h4>
                        </div>
                        <button onClick={() => setIsTranslatorOpen(false)} className="text-gray-400 hover:text-rose-400 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.15em] ml-1">Japanese Input</label>
                           <textarea 
                             value={translatorInput}
                             onChange={(e) => setTranslatorInput(e.target.value)}
                             placeholder="Paste Japanese text here..."
                             className="w-full h-28 p-4 rounded-[20px] bg-gray-50 border border-transparent focus:border-rose-100 outline-none text-sm resize-none font-sans leading-relaxed text-gray-700 placeholder:italic transition-all"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase text-rose-400 tracking-[0.15em] ml-1">Natural English</label>
                           <div className="w-full h-28 p-4 rounded-[20px] bg-rose-50/30 border border-rose-100 text-sm font-sans overflow-y-auto leading-relaxed text-gray-700 shadow-inner">
                              {isTranslating ? (
                                <div className="flex items-center gap-3 text-rose-300 h-full justify-center">
                                   <Loader2 className="w-5 h-5 animate-spin" /> 
                                   <span className="font-coquette-body italic text-base">Whispering to the winds...</span>
                                </div>
                              ) : (
                                <span className={translatorResult ? "font-medium" : "italic opacity-50"}>
                                  {translatorResult || "Awaiting the scribe's ink..."}
                                </span>
                              )}
                           </div>
                        </div>
                     </div>
                     <button 
                       onClick={handleTranslate}
                       disabled={isTranslating || !translatorInput.trim()}
                       className="w-full py-4 rounded-[20px] bg-rose-400 text-white font-bold text-sm hover:bg-rose-500 transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-3 active:scale-[0.98]"
                     >
                       <Languages className="w-5 h-5" /> 
                       <span className="uppercase tracking-widest font-black">Translate Text</span>
                     </button>
                   </motion.div>
                 )}
               </AnimatePresence>
               {currentMessages.map((msg) => ( <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group/message`}>{msg.sender === 'persona' && <img src={activeContact.avatar} alt="Avatar" className="w-8 h-8 rounded-full mr-2 self-end mb-1 shadow-sm object-cover" />}<div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>{msg.sender === 'user' && <button onClick={() => handleAnalyzeGrammarClick(msg)} disabled={analyzingMessageId === msg.id} className={`transition-all duration-300 p-1.5 rounded-full shadow-sm mb-1 z-10 ${analyzingMessageId === msg.id ? 'bg-rose-100 text-rose-400 cursor-wait' : 'bg-white/80 hover:bg-white text-rose-300 opacity-0 group-hover/message:opacity-100'} ${msg.correction ? 'text-rose-500' : ''}`}>{analyzingMessageId === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}</button>}<div className={`px-5 py-3 text-sm leading-relaxed shadow-sm font-coquette-body relative ${msg.sender === 'user' ? 'bg-rose-300 text-white rounded-2xl rounded-br-sm' : 'bg-white text-gray-600 border border-rose-100 rounded-2xl rounded-bl-sm'}`}><p className="whitespace-pre-wrap">{msg.text}</p><p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-300'}`}>{msg.timestamp}</p></div>{msg.sender === 'persona' && <button onClick={() => speakText(msg.text, activeContact.id, msg.id)} disabled={loadingAudioId === msg.id} className={`p-2 rounded-full transition-all mb-1 ${speakingMessageId === msg.id ? 'bg-rose-100 text-rose-500' : 'text-rose-200 hover:text-rose-400'}`}>{loadingAudioId === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (speakingMessageId === msg.id ? <StopCircle className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />)}</button>}</div></motion.div> ))}
               {isTyping && <div className="flex justify-start"><img src={activeContact.avatar} className="w-8 h-8 rounded-full mr-2 self-end mb-1" /><div className="bg-white border border-rose-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></span></div></div>}
               <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-rose-100">
               <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">{activeContact?.chips.map((suggestion, idx) => ( <button key={idx} onClick={() => setInputValue(suggestion)} className="whitespace-nowrap px-4 py-1.5 rounded-full border border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-500 hover:bg-rose-100 transition-colors shadow-sm flex items-center gap-1.5"><Lightbulb className="w-3 h-3 text-rose-400" /> {suggestion}</button> ))}</div>
               <div className="flex gap-2 items-end">
                  <button onClick={handleNudgeAI} disabled={isTyping} className="p-3 rounded-full bg-rose-100 text-rose-400 hover:bg-rose-200 transition-all shadow-sm group relative" title="Nudge AI"><Wand2 className="w-5 h-5 group-hover:scale-110" /><span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Nudge AI</span></button>
                  <button onClick={() => setIsTranslatorOpen(!isTranslatorOpen)} className={`p-3 rounded-full transition-all shadow-sm ${isTranslatorOpen ? 'bg-rose-400 text-white' : 'bg-gray-50 text-gray-400 hover:text-rose-400'}`} title="Quick Translate"><Languages className="w-5 h-5" /></button>
                  <div className="flex-1 relative"><textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="日本語でメッセージを入力..." className="w-full rounded-3xl pl-5 pr-12 py-3 bg-gray-50 focus:bg-white border border-transparent focus:border-rose-200 focus:ring-2 focus:ring-rose-100 resize-none outline-none text-gray-700 placeholder:text-gray-400 transition-all font-coquette-body shadow-inner max-h-[100px]" rows={1} /><button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-400"><Smile className="w-5 h-5" /></button></div>
                  <button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping} className="p-3 rounded-full bg-rose-400 text-white shadow-lg hover:bg-rose-500 transition-all disabled:opacity-50"><Send className="w-5 h-5 fill-current" /></button>
               </div>
            </div>
          </>
          )}
          </motion.div>
        ) : (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-rose-50/30"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
              <Sparkles className="w-10 h-10 text-rose-300" />
            </div>
            <h2 className="text-3xl font-bold font-coquette-header text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-400 max-w-xs mx-auto font-coquette-body italic">Select a friend or visit <strong>Mission Control</strong> to begin.</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      {activeContact && !isMissionMode && !isDrillMode && ( <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} persona={activeContact} onSave={handleSaveProfile} /> )}
      <CreateContactModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateContact} />
      <CorrectionModal isOpen={!!correctionData} onClose={() => setCorrectionData(null)} data={correctionData} />
    </motion.div>
  );
};

export default MessengerTab;
