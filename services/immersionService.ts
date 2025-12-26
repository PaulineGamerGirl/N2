
import { GoogleGenAI, Type } from "@google/genai";
import { VideoAnalysis, ExplanationCard, DialogueNode, TokenType } from "../types/immersionSchema";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHUNK_SIZE = 300; 
const ENRICH_BATCH_SIZE = 20; 
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

export const enrichSubtitles = async (
  jpNodes: DialogueNode[], 
  enNodes?: DialogueNode[],
  onProgress?: (p: number) => void
): Promise<DialogueNode[]> => {
  const total = jpNodes.length;
  const enrichedNodes: DialogueNode[] = [];

  const promptBase = `
    You are the Linguistic Alignment Heart of Nihongo Nexus.
    TASK: Parallel Snapping & Analysis. Match each Japanese line to its CORRECT English translation from context.
  `;

  for (let i = 0; i < total; i += ENRICH_BATCH_SIZE) {
    const jpBatch = jpNodes.slice(i, i + ENRICH_BATCH_SIZE);
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

/**
 * Streaming Sentence Explainer (v3.3)
 * Optimized for Japanese text in analysis and deep conjugation focus.
 */
export const explainToken = async (
  fullSentence: string, 
  targetPhrase: string, 
  groundTruthTranslation: string,
  localRank?: number | null,
  onUpdate?: (partial: ExplanationCard) => void
): Promise<ExplanationCard> => {
  const prompt = `
    You are a linguistic expert and Japanese language teacher. 
    Your task is to deconstruct Japanese sentences into a specific "Meaning → Analysis" format.

    SENTENCE: "${fullSentence}"
    TARGET PHRASE: "${targetPhrase}"
    CONTEXT TRANSLATION: "${groundTruthTranslation}"

    Follow these rules strictly:

    1. **Part-by-Part Breakdown**: Divide the sentence into logical grammatical chunks.
       For each chunk, provide:
       - **Meaning**: A concise English definition.
       - **Analysis**: A detailed technical explanation of the grammar. 
         - **CRITICAL RULE 1**: Use **JAPANESE CHARACTERS (Kanji/Kana)** for all Japanese terms in your explanation. Do NOT use Romaji within the analysis text (e.g., write "食べる", not "taberu").
         - **CRITICAL RULE 2**: If there is a conjugation, explicitly state the form (e.g., Causative, Passive, Volitional) and **explain exactly what nuance** that form adds to the word (e.g., "The causative form indicates making or letting someone do X").

    2. **Simple Sentence Explanation**:
       - **Natural Translation**: A natural English translation of the full sentence.
       
    OUTPUT FORMAT: Return strict JSON.
  `;

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                japanese: { type: Type.STRING },
                romaji: { type: Type.STRING },
                meaning: { type: Type.STRING },
                grammar_analysis: { type: Type.STRING },
                isTarget: { type: Type.BOOLEAN, description: "True if this segment contains or matches the target phrase" },
              },
              required: ["japanese", "romaji", "meaning", "grammar_analysis", "isTarget"]
            }
          },
          naturalTranslation: { type: Type.STRING }
        },
        required: ["segments", "naturalTranslation"]
      }
    }
  });

  let accumulatedText = '';
  
  for await (const chunk of responseStream) {
    accumulatedText += chunk.text;
    
    if (onUpdate) {
      const clean = accumulatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      const possibleFixes = [
        clean,
        clean + ']}',
        clean + '"]}',
        clean + '"}]}'
      ];
      
      for (const fix of possibleFixes) {
        try {
          const parsed = JSON.parse(fix);
          if (parsed.segments && Array.isArray(parsed.segments)) {
            onUpdate(parsed as ExplanationCard);
            break; 
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  const finalText = accumulatedText.replace(/```json/g, '').replace(/```/g, '').trim();
  const finalJson = JSON.parse(finalText) as ExplanationCard;
  
  if (onUpdate) onUpdate(finalJson);
  return finalJson;
};
