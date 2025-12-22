
import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initSensei = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing!");
    return;
  }
  // Fix: Initialize GoogleGenAI with named parameter apiKey
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: Using gemini-3-flash-preview for standard educational text tasks
  chatSession = genAI.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a professional, helpful, and encouraging Japanese language tutor.
      Your student is studying for the JLPT N2 exam.
      Your goal is to provide clear, high-quality explanations for grammar, vocabulary, and nuance.
      
      Guidelines:
      1. Tone: Warm, polite, and motivating. Avoid slang or overly casual language.
      2. Content: Focus on N2-level material. If a user asks about a word, explain its nuance and give an example sentence suitable for an N2 student.
      3. Format: Keep responses concise and easy to read. Use bullet points if listing information.
      4. Encouragement: Occasionally remind the student of their progress, but prioritize answering their questions accurately.
      
      Do not use sci-fi roleplay or "commander" personas. Just be an excellent teacher.`,
    },
  });
};

export const talkToSensei = async (message: string): Promise<string> => {
  if (!chatSession) {
    initSensei();
  }
  if (!chatSession) {
    return "Connection to Sensei not established. Please check your API key.";
  }

  try {
    const result = await chatSession.sendMessage({ message });
    // Fix: Access .text property directly instead of calling it as a function
    return result.text || "";
  } catch (error) {
    console.error("Sensei Error:", error);
    return "I'm having trouble connecting at the moment. Please try again.";
  }
};
