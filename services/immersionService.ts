
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { VideoAnalysis, ExplanationCard, DialogueNode, TokenType } from "../types/immersionSchema";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHUNK_SIZE = 300; 
const ENRICH_BATCH_SIZE = 8; // Small batch size for higher quality translation
const MAX_RETRIES = 5; // Increased retries for rate limits

// Pulse & Pause Config
const PROCESS_CHUNK_DURATION = 300; // 5 minutes
const COOL_DOWN_DURATION = 60; // 60 seconds

// --- UTILS ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust Retry Wrapper for Gemini API calls.
 * Specifically handles 429 Resource Exhausted errors with exponential backoff.
 */
const callWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  initialDelay = 4000 // Start with 4 seconds delay
): Promise<T> => {
  let currentDelay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // Check for various forms of 429/Quota errors in Google GenAI SDK
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        (error?.message && (
          error.message.includes('429') || 
          error.message.includes('quota') || 
          error.message.includes('RESOURCE_EXHAUSTED')
        ));

      if (isRateLimit) {
        if (i === retries - 1) throw error; // Rethrow on last attempt
        console.warn(`[Gemini API] Rate limit hit. Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`);
        await delay(currentDelay);
        currentDelay *= 2; // Exponential backoff (4s -> 8s -> 16s -> 32s...)
      } else {
        throw error; // Throw non-transient errors immediately
      }
    }
  }
  throw new Error("API Max Retries Exceeded");
};

/**
 * Extracts a 25-second audio sample from the start of a video file for synchronization.
 */
export const getAudioSample = async (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.currentTime = 0;

    video.onloadeddata = () => {
      // @ts-ignore
      const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
      const audioTrack = stream.getAudioTracks()[0];
      
      if (!audioTrack) {
        URL.revokeObjectURL(video.src);
        reject(new Error("No audio track found in video."));
        return;
      }

      const mediaStream = new MediaStream([audioTrack]);
      const recorder = new MediaRecorder(mediaStream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' }); // Gemini supports webm audio
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          URL.revokeObjectURL(video.src);
          video.remove();
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      };

      video.play().catch(e => console.warn("Auto-play blocked", e));
      recorder.start();

      // Record 25 seconds (enough to find the first dialogue usually)
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          video.pause();
        }
      }, 25000);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video for audio sampling."));
    };
  });
};

/**
 * Uses Gemini to listen to the audio and find the time shift required.
 */
export const calculateSubtitleOffset = async (
  audioBase64: string, 
  firstLines: { text: string, start: number }[]
): Promise<number> => {
  const scriptText = firstLines.map((l, i) => `Line ${i+1} [${l.start.toFixed(2)}s]: ${l.text}`).join('\n');
  
  const prompt = `
    You are a synchronization engineer.
    
    INPUT 1: Audio file (First 25 seconds of an anime episode).
    INPUT 2: Subtitle Script (Expected timestamps and text).
    
    TASK: 
    1. Listen to the audio. Identify exactly when the FIRST spoken line from the script actually occurs in the audio.
    2. Compare the ACTUAL Audio Time with the SCRIPT Timestamp.
    3. Calculate the OFFSET: (Actual Audio Time - Script Timestamp).
    
    SCRIPT:
    ${scriptText}
    
    OUTPUT JSON:
    { "offsetSeconds": number } 
    (e.g., if script says 2.0s but audio starts at 3.5s, offset is +1.5)
  `;

  try {
    const response = await callWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          { inlineData: { data: audioBase64, mimeType: 'audio/webm' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            offsetSeconds: { type: Type.NUMBER }
          },
          required: ["offsetSeconds"]
        }
      }
    }));

    if (response.text) {
      const result = JSON.parse(response.text);
      return result.offsetSeconds || 0;
    }
    return 0;
  } catch (error) {
    console.error("Auto-Sync Failed:", error);
    return 0; // Fallback to 0 if AI fails
  }
};

// --- ANALYSIS ---

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
  segment: TimeSegment
): Promise<DialogueNode[]> => {
  const prompt = `
    Analyze media ${segment.start.toFixed(2)}s to ${segment.end.toFixed(2)}s. 
    1. STRICT VERBATIM: Transcribe EXACTLY what is spoken.
    2. Morpheme Splitting (Japanese): Root (CONTENT), Conjugation (GRAMMAR).
    3. LEMMATIZATION: CONTENT tokens must have 'baseForm'.
    4. Semantic Linking (groupId): Concept IDs.
  `;

  try {
    const response = await callWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    }));

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return (parsed.nodes || []).map((node: DialogueNode) => ({
        ...node,
        id: `c${segment.index}_${node.id}`
      }));
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error(`Analysis failed for segment ${segment.index}`, error);
    return [];
  }
};

/**
 * ENRICHMENT: Video + JP SRT -> AI Translated & Tokenized
 * Uses "Pulse & Pause" Strategy: Processing 5-minute chunks with 60s cooldowns.
 */
export const enrichSubtitles = async (
  jpNodes: DialogueNode[], 
  onProgress?: (percent: number, status?: string) => void
): Promise<DialogueNode[]> => {
  
  // 1. Bucket nodes into 5-minute chunks based on timestamp
  const chunks: DialogueNode[][] = [];
  let currentChunk: DialogueNode[] = [];
  let currentChunkIndex = 0;

  // Sorting input ensures accurate chunking
  const sortedNodes = [...jpNodes].sort((a, b) => a.timestampStart - b.timestampStart);

  sortedNodes.forEach(node => {
    const nodeChunkIndex = Math.floor(node.timestampStart / PROCESS_CHUNK_DURATION);
    
    // If we jumped to a new 5-minute block
    if (nodeChunkIndex > currentChunkIndex) {
      if (currentChunk.length > 0) chunks.push(currentChunk);
      // Fill empty gaps if any (e.g. no subtitles for minutes 5-10)
      currentChunk = [];
      currentChunkIndex = nodeChunkIndex;
    }
    currentChunk.push(node);
  });
  if (currentChunk.length > 0) chunks.push(currentChunk);

  const totalChunks = chunks.length;
  const enrichedNodes: DialogueNode[] = [];
  let processedNodeCount = 0;

  const promptBase = `
    You are the Translation Core of Nihongo Nexus.
    INPUT: A batch of Japanese subtitle lines (Dual-Language or Single-Language).
    TASK: 
    1. Translate the Japanese to NATURAL English.
       - Context Awareness: Sentences often span multiple subtitle lines. Translate the FULL sentence on the first line, and leave the second line empty or mark as (...) if it's just a continuation.
       - Match the speaker's tone (polite vs casual).
    2. Tokenize the Japanese text into [Content/Grammar].
    3. SEMANTIC LINKING (Green Highlight) & ALIGNMENT:
       - CRITICAL: The English translation MUST structurally match the Japanese concepts for highlighting to work.
       - Assign a unique integer 'groupId' to a Japanese token (or phrase).
       - Assign the SAME 'groupId' to the corresponding English token(s) that represent that specific meaning.
       - Every major content word (Noun, Verb, Adjective) in Japanese SHOULD have a corresponding English token with the same groupId.
       - Grammar particles can have groupId=0 (no link).
       
    OUTPUT: Return the nodes with 'japanese' and 'english' arrays fully populated.
  `;

  // 2. Process Each Chunk
  for (let cIdx = 0; cIdx < totalChunks; cIdx++) {
    const chunk = chunks[cIdx];
    const totalInChunk = chunk.length;

    if (onProgress) {
        onProgress(
            Math.round((processedNodeCount / sortedNodes.length) * 100), 
            `Analyzing Chunk ${cIdx + 1}/${totalChunks} (${(cIdx * 5)}-${(cIdx + 1) * 5}m)...`
        );
    }

    for (let i = 0; i < totalInChunk; i += ENRICH_BATCH_SIZE) {
      // Throttle intra-chunk batches slightly
      if (i > 0) await delay(4000);

      const batch = chunk.slice(i, i + ENRICH_BATCH_SIZE);
      
      const simplifiedInput = batch.map(n => ({
        id: n.id,
        text: n.japanese.map(t => t.text).join('')
      }));

      // Update generic progress within the chunk
      const chunkProgress = (i / totalInChunk);
      const overallProgress = ((cIdx + chunkProgress) / totalChunks) * 100;
      if (onProgress) {
          onProgress(
              Math.round(overallProgress), 
              `Enriching Chunk ${cIdx + 1}/${totalChunks}: Line ${i}-${Math.min(i + ENRICH_BATCH_SIZE, totalInChunk)}`
          );
      }

      try {
        const response = await callWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
          model: 'gemini-2.5-flash', 
          contents: `${promptBase}\n\nINPUT DATA:\n${JSON.stringify(simplifiedInput)}`,
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
        }));

        if (response.text) {
          const results = JSON.parse(response.text);
          results.forEach((res: any) => {
            const original = batch.find(n => n.id === res.id);
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
        console.error("Enrichment Batch Error:", e);
        // Fallback: Push original if AI fails after all retries
        batch.forEach(b => enrichedNodes.push(b));
      }
    }

    processedNodeCount += chunk.length;

    // 3. COOL DOWN (if not last chunk)
    if (cIdx < totalChunks - 1) {
      for (let t = COOL_DOWN_DURATION; t > 0; t--) {
        if (onProgress) {
            onProgress(
                Math.round((processedNodeCount / sortedNodes.length) * 100), 
                `☕ Taking a break (Cooling Neural Link)... Resuming in ${t}s`
            );
        }
        await delay(1000); // 1 second real-time tick
      }
    }
  }

  if (onProgress) onProgress(100, "Finalizing...");
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

  const fallbackResult: ExplanationCard = { 
    segments: [], 
    naturalTranslation: "Analysis unavailable due to high traffic." 
  };

  try {
    // Attempting backoff for stream creation
    const responseStream = await callWithBackoff<AsyncIterable<GenerateContentResponse>>(() => ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
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
    }));

    let accumulatedText = '';
    
    for await (const chunk of responseStream) {
      accumulatedText += chunk.text || '';
      
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

  } catch (e) {
    console.error("Explanation Failed:", e);
    return fallbackResult;
  }
};
