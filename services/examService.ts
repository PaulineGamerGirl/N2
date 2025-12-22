
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, ExamMode } from "../types";

// Initialize GoogleGenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a targeted Japanese quiz based on specific grammar points or chapters.
 * Refined logic ensures strict adherence to user-selected sub-points.
 */
export const generateQuiz = async (
  chapters: string[],
  mode: ExamMode,
  userContext: string,
  targetGrammarPoints: string[] = [],
  isJLPTMode: boolean = true
): Promise<QuizQuestion[]> => {
  if (chapters.length === 0 && targetGrammarPoints.length === 0) {
    throw new Error("No study targets selected.");
  }

  const isAdvanced = chapters.some(c => c.includes('quartet'));
  const level = isAdvanced ? 'JLPT N3/N2' : 'JLPT N5/N4';

  // --- LOGIC FIX: STRICT TOPIC FILTERING ---
  let targetClause = "";
  if (targetGrammarPoints.length > 0) {
    targetClause = `
      TARGET GRAMMAR POINTS: ${targetGrammarPoints.join(', ')}
      CONSTRAINT: You MUST ONLY generate questions for the specific points listed above. 
      DO NOT include other grammar structures even if they are in the same chapter.
    `;
  } else {
    targetClause = `
      GENERAL TOPIC: Content from textbooks: ${chapters.join(', ')}
    `;
  }

  // --- LOGIC FIX: DRILL STYLE ---
  let styleInstruction = '';
  if (isJLPTMode) {
    styleInstruction = `
      MODE: JLPT EXAM SIMULATION
      - Format: Multiple Choice (4 options).
      - Style: Pattern recognition, particle choice, and star/sorting challenges.
      - Objective: Mimic the strict logical structure of the JLPT exam.
    `;
  } else {
    styleInstruction = `
      MODE: DEEP UNDERSTANDING
      - Format: Sentence reconstruction or translation-based multiple choice.
      - Style: Situational nuance and production-heavy challenges.
      - Objective: Test if the student can use the grammar in active conversation.
    `;
  }

  const prompt = `
    You are a professional Japanese Language Professor.
    
    ${targetClause}
    
    QUANTITY: Generate exactly 5 distinct questions.
    LEVEL: ${level}
    
    ${styleInstruction}

    STUDENT CONTEXT (Reference for examples): "${userContext.slice(0, 1500)}"

    OUTPUT REQUIREMENT: Return a JSON array containing exactly 5 objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The quiz question text." },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 possible answers." },
              correctIndex: { type: Type.INTEGER, description: "0-based index of the correct answer." },
              explanation: { type: Type.STRING, description: "Brief explanation in English of why the answer is correct." },
              topic: { type: Type.STRING, description: "The specific grammar point being tested." }
            },
            required: ['question', 'options', 'correctIndex', 'explanation', 'topic']
          }
        }
      }
    });

    if (response.text) {
      const questions = JSON.parse(response.text) as QuizQuestion[];
      // Logic Fix: Handle cases where model might return fewer than 5 but is still valid
      if (questions.length > 0) {
        return questions;
      }
    }
    throw new Error("Empty or invalid AI response.");
  } catch (error) {
    console.error("Exam Generation Logic Error:", error);
    // Return a safe fallback related to the actual error type
    return [
      {
        question: "The Neural Link (API) encountered a synchronization error. Which particle typically marks the target of an action?",
        options: ["に", "を", "は", "が"],
        correctIndex: 0,
        explanation: "This is a fallback question. 'Ni' marks the target/destination.",
        topic: "System Fallback"
      }
    ];
  }
};
