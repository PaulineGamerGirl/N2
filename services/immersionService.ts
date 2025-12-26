
import { GoogleGenAI, Type } from "@google/genai";
import { VideoAnalysis, ExplanationCard, DialogueNode, TokenType } from "../types/immersionSchema";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHUNK_SIZE = 300; 
const ENRICH_BATCH_SIZE = 20; // Reduced for higher precision in mapping
const MAX_RETRIES = 2;

interface TimeSegment {
  start: number;
  end: number;
  index: number;
}

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

const analyzeSegment = async (
  base64Data: string, 
  mimeType: string, 
  segment: TimeSegment,
  retryCount = 0
): Promise<DialogueNode[]> => {
  const prompt = `
    Analyze media ${segment.start.toFixed(2)}s to ${segment.end.toFixed(2)}s. 
    1. STRICT VERBATIM: Transcribe EXACTLY what is spoken.
    2. Morpheme Splitting (Japanese): Root (CONTENT), Conjugation (GRAMMAR).
    3. LEMMATIZATION: CONTENT tokens must have 'baseForm'.
    4. Semantic Linking (groupId): Concept IDs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: prompt }],
      },
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
                        baseForm: { type: Type.STRING },
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
      return (parsed.nodes || []).map((node: DialogueNode) => ({
        ...node,
        id: `c${segment.index}_${node.id}`
      }));
    }
    throw new Error("Empty response");
  } catch (error) {
    if (retryCount < MAX_RETRIES) return analyzeSegment(base64Data, mimeType, segment, retryCount + 1);
    return [];
  }
};

/**
 * Subtitle Enrichment Engine (v2.1: Semantic SNAP Alignment)
 * Robustly pairs Japanese source with English source even if timestamps drift.
 */
export const enrichSubtitles = async (
  jpNodes: DialogueNode[], 
  enNodes?: DialogueNode[],
  onProgress?: (p: number) => void
): Promise<DialogueNode[]> => {
  const total = jpNodes.length;
  const enrichedNodes: DialogueNode[] = [];

  const promptBase = `
    You are the Linguistic Alignment Heart of Nihongo Nexus.
    
    TASK: Parallel Snapping & Analysis.
    You will receive a batch of Japanese lines and a 'Context Map' of possible English matches.
    
    RULES:
    1. SNAP ALIGNMENT: Match each Japanese line to its CORRECT English translation from the context. Ignore slight timestamp differences; prioritize semantic meaning.
    2. SYMMETRIC HIGHLIGHTING: 
       - Identify shared concepts between the JP and EN lines.
       - Assign them matching integer 'groupId' values (1, 2, 3...).
       - If 'ノート' is ID 5, 'note' in English MUST also be ID 5.
    3. TOKENIZATION: Split JP into CONTENT/GRAMMAR. Keep English natural but tokenized.
    4. PRESERVATION: Do not invent new English. Use the provided maps.
  `;

  for (let i = 0; i < total; i += ENRICH_BATCH_SIZE) {
    const jpBatch = jpNodes.slice(i, i + ENRICH_BATCH_SIZE);
    
    // Create a context window of English lines for the AI to "look ahead/behind"
    // This handles the 5-second drift mentioned by the user.
    const windowStart = Math.max(0, i - 10);
    const windowEnd = Math.min(enNodes?.length || 0, i + ENRICH_BATCH_SIZE + 10);
    const enContext = enNodes?.slice(windowStart, windowEnd).map(n => ({
      ts: n.timestampStart.toFixed(1),
      text: n.japanese.map(t => t.text).join('')
    })) || [];

    const batchInput = {
      japaneseLines: jpBatch.map(n => ({
        id: n.id,
        ts: n.timestampStart.toFixed(1),
        text: n.japanese.map(t => t.text).join('')
      })),
      englishContextMap: enContext
    };

    if (onProgress) onProgress(Math.round((i / total) * 100));

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${promptBase}\n\nINPUT DATA:\n${JSON.stringify(batchInput)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                japanese: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      romaji: { type: Type.STRING },
                      baseForm: { type: Type.STRING },
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
              required: ["id", "japanese", "english"]
            }
          }
        }
      });

      if (response.text) {
        const results = JSON.parse(response.text);
        results.forEach((res: any) => {
          const original = jpNodes.find(n => n.id === res.id);
          if (original) {
            enrichedNodes.push({
              ...original,
              japanese: res.japanese,
              english: res.english
            });
          }
        });
      }
    } catch (e) {
      console.error("Alignment Batch Error:", e);
      jpBatch.forEach(b => enrichedNodes.push(b));
    }
  }

  if (onProgress) onProgress(100);
  return enrichedNodes.sort((a, b) => a.timestampStart - b.timestampStart);
};

export const analyzeImmersionMedia = async (base64Data: string, mimeType: string, duration?: number): Promise<VideoAnalysis> => {
  if (!duration) {
    const result = await analyzeSegment(base64Data, mimeType, { start: 0, end: 9999, index: 0 });
    return { videoId: crypto.randomUUID(), title: "Analyzed Media", nodes: result };
  }
  const segments = generateSegments(duration);
  const chunkResults = await Promise.all(segments.map(seg => analyzeSegment(base64Data, mimeType, seg)));
  return {
    videoId: crypto.randomUUID(),
    title: "Deep Immersive Chronicle",
    nodes: chunkResults.flat().sort((a, b) => a.timestampStart - b.timestampStart)
  };
};

export const explainToken = async (contextSentence: string, targetPhrase: string): Promise<ExplanationCard> => {
  const prompt = `Sensei breakdown for context "${contextSentence}" and target "${targetPhrase}".`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headword: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, romaji: { type: Type.STRING }, basicMeaning: { type: Type.STRING } } },
          analysis: { type: Type.OBJECT, properties: { baseForm: { type: Type.STRING }, conjugationPath: { type: Type.ARRAY, items: { type: Type.STRING } }, breakdown: { type: Type.STRING } } },
          nuance: { type: Type.OBJECT, properties: { jlptLevel: { type: Type.STRING }, explanation: { type: Type.STRING } } },
          naturalTranslation: { type: Type.STRING }
        }
      }
    }
  });
  if (response.text) return JSON.parse(response.text) as ExplanationCard;
  throw new Error("Sensei failed");
};
