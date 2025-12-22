
import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initGemini = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing!");
    return;
  }
  // Fix: Initialize GoogleGenAI with named parameter apiKey
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: Using gemini-3-flash-preview for general text tasks
  chatSession = genAI.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are 'Sensei', a strict but encouraging Japanese language tutor in a sci-fi cyberpunk setting. 
      Your student is preparing for the JLPT N2 exam. 
      Keep responses concise, helpful, and occasionally use gaming metaphors (XP, leveling up, boss battles).
      If the user asks about Japanese grammar or vocab, provide clear explanations with examples.
      Maintain the persona of a digital AI guide aiding a human operator.`,
    },
  });
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    initGemini();
  }
  if (!chatSession) {
    return "Error: Neural Link (API) not initialized.";
  }

  try {
    const result = await chatSession.sendMessage({ message });
    // Fix: Access .text property directly instead of calling it as a function
    return result.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection disrupted. Please try again later.";
  }
};
