
import { GoogleGenAI, Type } from "@google/genai";
import { VideoAnalysis, ExplanationCard, DialogueNode } from "../types/immersionSchema";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for Virtual Chunking
const CHUNK_SIZE = 300; // 5 minutes in seconds
const MAX_RETRIES = 2;

interface TimeSegment {
  start: number;
  end: number;
  index: number;
}

/**
 * Helper to generate time segments for a given duration
 */
const generateSegments = (duration: number): TimeSegment[] => {
  const segments: TimeSegment[] = [];
  let current = 0;
  let index = 0;

  while (current < duration) {
    const end = Math.min(current + CHUNK_SIZE, duration);
    segments.push({ start: current, end, index });
    current = end;
    index++;
  }
  return segments;
};

/**
 * Single chunk analysis logic with retry wrapper
 */
const analyzeSegment = async (
  base64Data: string, 
  mimeType: string, 
  segment: TimeSegment,
  retryCount = 0
): Promise<DialogueNode[]> => {
  const prompt = `
    Analyze the provided media ONLY from timestamp ${segment.start.toFixed(2)} seconds to ${segment.end.toFixed(2)} seconds. 
    DO NOT transcribe or analyze anything before or after this specific range.
    
    CRITICAL TRANSCRIPTION RULES (VERBATIM MODE):
    1. STRICTLY VERBATIM: Transcribe EXACTLY what is spoken within this range. Include filler words (eto, ano, nanka), stutters, and false starts.
    2. NO CLEANING: The text must match the audio 1:1.
    3. PRECISION: Use sub-second (0.01s) precision for timestampStart and timestampEnd. 
    
    Linguistic Rules:
    1. Morpheme Splitting (Japanese): Split verbs/adjectives into Root (CONTENT) and Conjugation (GRAMMAR).
       Ex: "Tabetakatta" -> [Tabe (CONTENT)] + [ta (GRAMMAR)] + [katta (GRAMMAR)].
    2. Semantic Linking (groupId): Assign a unique integer ID to distinct concepts. 
       If JP "Ringo" maps to EN "Apple", they share the same groupId.
    3. Type Logic:
       CONTENT: Nouns, Verb Roots, Adjective Roots, Adverbs.
       GRAMMAR: Particles, Copulas, Verb Endings, Connectors.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  timestampStart: { type: Type.NUMBER },
                  timestampEnd: { type: Type.NUMBER },
                  speaker: { type: Type.STRING },
                  japanese: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        romaji: { type: Type.STRING },
                        type: { type: Type.STRING },
                        groupId: { type: Type.INTEGER }
                      },
                      required: ["text", "type", "groupId"]
                    }
                  },
                  english: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        type: { type: Type.STRING },
                        groupId: { type: Type.INTEGER }
                      },
                      required: ["text", "type", "groupId"]
                    }
                  }
                },
                required: ["id", "timestampStart", "timestampEnd", "speaker", "japanese", "english"]
              }
            }
          },
          required: ["nodes"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      // Tag IDs with chunk index to prevent collisions during stitching
      return (parsed.nodes || []).map((node: DialogueNode) => ({
        ...node,
        id: `c${segment.index}_${node.id}`
      }));
    }
    throw new Error("Empty response");

  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Retrying chunk ${segment.index} (Attempt ${retryCount + 1})...`);
      return analyzeSegment(base64Data, mimeType, segment, retryCount + 1);
    }
    console.error(`Chunk ${segment.index} failed after ${MAX_RETRIES} retries.`, error);
    return []; // Return empty array so the rest can still stitch
  }
};

/**
 * The "Immersion Engine"
 * Refactored to handle long-form content via segment parallelization.
 */
export const analyzeImmersionMedia = async (base64Data: string, mimeType: string, duration?: number): Promise<VideoAnalysis> => {
  if (!duration) {
    // Fallback to single-pass if duration isn't provided (unlikely given our current flow)
    const result = await analyzeSegment(base64Data, mimeType, { start: 0, end: 9999, index: 0 });
    return { videoId: crypto.randomUUID(), title: "Analyzed Media", nodes: result };
  }

  // 1. Generate Virtual Chunks
  const segments = generateSegments(duration);
  console.log(`Spinning up ${segments.length} agents for ${duration.toFixed(2)}s video...`);

  // 2. Parallel Processing
  const chunkResults = await Promise.all(
    segments.map(seg => analyzeSegment(base64Data, mimeType, seg))
  );

  // 3. Stitching & Chronological Sorting
  const allNodes = chunkResults
    .flat()
    .sort((a, b) => a.timestampStart - b.timestampStart);

  return {
    videoId: crypto.randomUUID(),
    title: "Deep Immersive Chronicle",
    nodes: allNodes
  };
};

/**
 * The "Deep Dive Sensei"
 */
export const explainToken = async (contextSentence: string, targetPhrase: string): Promise<ExplanationCard> => {
  const prompt = `
    You are the "Sensei" for Nihongo Nexus. Provide a "Gold Standard" grammatical breakdown.
    
    Context Sentence: "${contextSentence}"
    Target Phrase: "${targetPhrase}"

    TASKS:
    1. Explode the word into atomic parts (Base form + Conjugations + Particles).
    2. Explain nuance based on the context.
    
    Return strictly JSON matching the schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headword: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              romaji: { type: Type.STRING },
              basicMeaning: { type: Type.STRING }
            },
            required: ["text", "romaji", "basicMeaning"]
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              baseForm: { type: Type.STRING },
              conjugationPath: { type: Type.ARRAY, items: { type: Type.STRING } },
              breakdown: { type: Type.STRING }
            },
            required: ["baseForm", "conjugationPath", "breakdown"]
          },
          particle: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              function: { type: Type.STRING }
            }
          },
          nuance: {
            type: Type.OBJECT,
            properties: {
              jlptLevel: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["jlptLevel", "explanation"]
          },
          naturalTranslation: { type: Type.STRING }
        },
        required: ["headword", "analysis", "nuance", "naturalTranslation"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as ExplanationCard;
  }
  throw new Error("Sensei failed to explain");
};
