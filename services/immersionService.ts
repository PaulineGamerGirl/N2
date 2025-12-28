
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { VideoAnalysis, ExplanationCard, DialogueNode, TokenType } from "../types/immersionSchema";

const CHUNK_SIZE = 300; 
const ENRICH_BATCH_SIZE = 8; 
const MAX_RETRIES = 5; 

// Pulse & Pause Config
const PROCESS_CHUNK_DURATION = 300; 
const COOL_DOWN_DURATION = 60; 

// --- UTILS ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  initialDelay = 4000 
): Promise<T> => {
  let currentDelay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        (error?.message && (
          error.message.includes('429') || 
          error.message.includes('quota') || 
          error.message.includes('RESOURCE_EXHAUSTED')
        ));

      if (isRateLimit) {
        if (i === retries - 1) throw error; 
        console.warn(`[Gemini API] Rate limit hit. Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`);
        await delay(currentDelay);
        currentDelay *= 2; 
      } else {
        throw error; 
      }
    }
  }
  throw new Error("API Max Retries Exceeded");
};

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
        const blob = new Blob(chunks, { type: 'audio/webm' }); 
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

export const calculateSubtitleOffset = async (
  audioBase64: string, 
  firstLines: { text: string, start: number }[]
): Promise<number> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const scriptText = firstLines.map((l, i) => `Line ${i+1} [${l.start.toFixed(2)}s]: ${l.text}`).join('\n');
  
  const prompt = `
    You are a synchronization engineer.
    INPUT 1: Audio file. INPUT 2: Subtitle Script.
    TASK: Calculate the OFFSET: (Actual Audio Time - Script Timestamp).
    SCRIPT: ${scriptText}
    OUTPUT JSON: { "offsetSeconds": number } 
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
    return 0; 
  }
};

export const enrichSubtitles = async (
  jpNodes: DialogueNode[], 
  onProgress?: (percent: number, status?: string) => void
): Promise<DialogueNode[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chunks: DialogueNode[][] = [];
  let currentChunk: DialogueNode[] = [];
  let currentChunkIndex = 0;
  const sortedNodes = [...jpNodes].sort((a, b) => a.timestampStart - b.timestampStart);

  sortedNodes.forEach(node => {
    const nodeChunkIndex = Math.floor(node.timestampStart / PROCESS_CHUNK_DURATION);
    if (nodeChunkIndex > currentChunkIndex) {
      if (currentChunk.length > 0) chunks.push(currentChunk);
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
    Translate Japanese to NATURAL English. Tokenize. SEMANTIC LINKING (groupId). No romaji.
  `;

  for (let cIdx = 0; cIdx < totalChunks; cIdx++) {
    const chunk = chunks[cIdx];
    const totalInChunk = chunk.length;
    if (onProgress) {
        onProgress(Math.round((processedNodeCount / sortedNodes.length) * 100), `Analyzing Chunk ${cIdx + 1}/${totalChunks}...`);
    }
    for (let i = 0; i < totalInChunk; i += ENRICH_BATCH_SIZE) {
      if (i > 0) await delay(4000);
      const batch = chunk.slice(i, i + ENRICH_BATCH_SIZE);
      const simplifiedInput = batch.map(n => ({ id: n.id, text: n.japanese.map(t => t.text).join('') }));
      try {
        const response = await callWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview', 
          contents: `${promptBase}\n\nINPUT DATA:\n${JSON.stringify(simplifiedInput)}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  japanese: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, romaji: { type: Type.STRING }, baseForm: { type: Type.STRING }, type: { type: Type.STRING }, groupId: { type: Type.INTEGER } }, required: ["text", "type", "groupId"] } },
                  english: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, type: { type: Type.STRING }, groupId: { type: Type.INTEGER } }, required: ["text", "type", "groupId"] } }
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
            if (original) enrichedNodes.push({ ...original, japanese: res.japanese, english: res.english });
          });
        }
      } catch (e) {
        batch.forEach(b => enrichedNodes.push(b));
      }
    }
    processedNodeCount += chunk.length;
    if (cIdx < totalChunks - 1) {
      for (let t = COOL_DOWN_DURATION; t > 0; t--) {
        if (onProgress) onProgress(Math.round((processedNodeCount / sortedNodes.length) * 100), `☕ Cooling Link... Resuming in ${t}s`);
        await delay(1000);
      }
    }
  }
  return enrichedNodes.sort((a, b) => a.timestampStart - b.timestampStart);
};

export const getBatchReadings = async (
  items: { id: string; word: string; sentence: string }[]
): Promise<Record<string, string>> => {
  if (items.length === 0) return {};
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Provide KANA READING for the target words in context. JSON { "id": "uuid", "reading": "kana" }.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt}\n\nDATA: ${JSON.stringify(items)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, reading: { type: Type.STRING } }, required: ["id", "reading"] } }
      }
    });
    if (response.text) {
      const results = JSON.parse(response.text);
      const map: Record<string, string> = {};
      results.forEach((r: any) => { map[r.id] = r.reading; });
      return map;
    }
    return {};
  } catch (error) {
    return {};
  }
};

/**
 * Expert Japanese Linguistic Analysis Protocol v8.0
 */
export const explainToken = async (
  fullSentence: string, 
  targetPhrase: string, 
  groundTruthTranslation: string,
  localRank?: number | null,
  onUpdate?: (partial: ExplanationCard) => void
): Promise<ExplanationCard> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    You are an expert Japanese linguist. Break down sentences by grouping related words into "Meaningful Phrases" (thought chunks).
    
    FOR EVERY INPUT CHUNK:
    - japanese: [The phrase text. Example: "やめちゃうと" instead of just "やめる"]
    - meaning: English translation of this specific chunk.
    - grammar_analysis:
        1. Identify base form and reading in HIRAGANA. 
        2. Detail the "Grammar Chain" step-by-step (e.g., Verb -> Passive -> Neg -> Cond).
        3. Explain particle functions.
        4. CRITICAL: DO NOT USE markdown bolding (**) inside this string field.
    - jlptLevel: Specific JLPT level (N5-N1).
    - isTarget: True if this chunk contains "${targetPhrase}".

    STRICT RULES:
    1. Group particles with their nouns.
    2. Group auxiliary verbs with their main verbs. 
    3. ABSOLUTELY NO ROMAJI. Use Kana/Kanji only.
    4. Maintain the professional tone of a Sensei.

    SENTENCE: "${fullSentence}"
    TARGET: "${targetPhrase}"
    CONTEXT: "${groundTruthTranslation}"
  `;
  try {
    const responseStream = await callWithBackoff<AsyncIterable<GenerateContentResponse>>(() => ai.models.generateContentStream({
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
                  meaning: { type: Type.STRING }, 
                  grammar_analysis: { type: Type.STRING }, 
                  jlptLevel: { type: Type.STRING },
                  isTarget: { type: Type.BOOLEAN } 
                }, 
                required: ["japanese", "meaning", "grammar_analysis", "isTarget"] 
              } 
            },
            naturalTranslation: { type: Type.STRING },
            visualLogic: { type: Type.STRING }
          },
          required: ["segments", "naturalTranslation", "visualLogic"]
        }
      }
    }));

    let accumulatedText = '';
    for await (const chunk of responseStream) {
      accumulatedText += chunk.text || '';
      if (onUpdate) {
        const clean = accumulatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        try { 
          const parsed = JSON.parse(clean + (clean.endsWith('}') ? '' : '"}')); 
          onUpdate(parsed as ExplanationCard); 
        } catch (e) {}
      }
    }
    const finalClean = accumulatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(finalClean) as ExplanationCard;
  } catch (e) {
    console.error("Explanation Failed:", e);
    return { segments: [], naturalTranslation: "Analysis unavailable.", visualLogic: "Logic map failed." };
  }
};

export const analyzeImmersionMedia = async (base64Data: string, mimeType: string, duration?: number): Promise<VideoAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze media. Transcribe. Morpheme Splitting. Lemmatize. No romaji.`;
  const response = await callWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [{ inlineData: { data: base64Data, mimeType: mimeType } }, { text: prompt }] },
    config: { responseMimeType: 'application/json' }
  }));
  if (response.text) {
    const parsed = JSON.parse(response.text);
    return { videoId: crypto.randomUUID(), title: "Media Analysis", nodes: parsed.nodes || [] };
  }
  throw new Error("Failed");
};
