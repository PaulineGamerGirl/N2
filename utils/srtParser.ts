
import { DialogueNode, TokenType } from '../types/immersionSchema';

/**
 * Converts timestamp string to seconds.
 * Robustly handles:
 * - HH:MM:SS,ms (SRT)
 * - HH:MM:SS.cs (ASS)
 * - MM:SS.ms (VTT)
 */
const parseTimestampToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // Normalize separators: replace comma with dot
  const normalized = timeStr.trim().replace(',', '.');
  const parts = normalized.split(':');
  
  let seconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS.ms
    seconds += parseFloat(parts[0]) * 3600;
    seconds += parseFloat(parts[1]) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS.ms
    seconds += parseFloat(parts[0]) * 60;
    seconds += parseFloat(parts[1]);
  } else if (parts.length === 1) {
    // SS.ms
    seconds += parseFloat(parts[0]);
  }
  
  return isNaN(seconds) ? 0 : seconds;
};

/**
 * Checks if a string contains Japanese characters.
 */
const containsJapanese = (text: string): boolean => {
  // Hiragana, Katakana, Kanji, CJK Punctuation
  const jpRegex = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/;
  return jpRegex.test(text);
};

const cleanText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '')       // HTML tags <i>, <b>
    .replace(/\{[^}]*\}/g, '')     // ASS tags {\an8}
    .replace(/\\N/g, ' ')          // ASS newlines
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
};

/**
 * Parsing Logic for ASS/SSA Formats
 */
const parseASS = (content: string): DialogueNode[] => {
  const nodes: DialogueNode[] = [];
  const lines = content.split(/\r?\n/);
  
  // Default format spec (fallback)
  let formatSpec = ["Layer", "Start", "End", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text"];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // 1. Detect Format Line to map columns
    if (trimmed.startsWith('Format:')) {
       const parts = trimmed.substring(7).split(',').map(s => s.trim());
       if (parts.length > 5) formatSpec = parts;
       return;
    }
    
    // 2. Parse Dialogue Lines
    if (trimmed.startsWith('Dialogue:') || trimmed.startsWith('Comment:')) {
       const firstColon = trimmed.indexOf(':');
       const rawValues = trimmed.substring(firstColon + 1).trim();
       
       // Handle commas inside the Text field by only splitting the first N-1 commas
       const fieldCount = formatSpec.length;
       const splitValues: string[] = [];
       let currentPos = 0;
       
       for (let i = 0; i < fieldCount - 1; i++) {
          const nextComma = rawValues.indexOf(',', currentPos);
          if (nextComma === -1) break; 
          splitValues.push(rawValues.substring(currentPos, nextComma).trim());
          currentPos = nextComma + 1;
       }
       // The rest is the text
       splitValues.push(rawValues.substring(currentPos));
       
       if (splitValues.length < fieldCount) return;
       
       const startIndex = formatSpec.indexOf("Start");
       const endIndex = formatSpec.indexOf("End");
       const textIndex = formatSpec.indexOf("Text");
       
       if (startIndex === -1 || endIndex === -1 || textIndex === -1) return;
       
       const startTime = parseTimestampToSeconds(splitValues[startIndex]);
       const endTime = parseTimestampToSeconds(splitValues[endIndex]);
       const rawText = splitValues[textIndex];
       const cleaned = cleanText(rawText);
       
       if (cleaned) {
          nodes.push({
             id: `ass_${idx}`,
             timestampStart: startTime,
             timestampEnd: endTime,
             speaker: "Subtitle",
             japanese: [{ text: cleaned, type: TokenType.CONTENT, groupId: -1 }],
             english: [],
             grammarNotes: []
          });
       }
    }
  });
  
  return nodes;
};

/**
 * Parsing Logic for SRT/VTT
 */
const parseSRTOrVTT = (content: string): DialogueNode[] => {
  const nodes: DialogueNode[] = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Regex for SRT/VTT Timestamps
  // Group 1: Start, Group 2: End
  const timestampRegex = /((?:\d{1,2}:)?\d{1,2}:\d{1,2}[,.]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{1,2}[,.]\d{1,3})/;

  let currentStart = 0;
  let currentEnd = 0;
  let textBuffer: string[] = [];
  let isCollecting = false;

  const flush = (idx: number) => {
    if (textBuffer.length > 0) {
      const cleanedLines = textBuffer.map(cleanText).filter(l => l);
      
      if (cleanedLines.length > 0) {
        // Japanese Filtering Strategy
        // If ANY line has JP, keep ONLY JP lines. 
        // If NO line has JP, keep ALL lines (fallback for English subs or Romaji).
        const hasJP = cleanedLines.some(containsJapanese);
        const finalLines = hasJP 
          ? cleanedLines.filter(containsJapanese) 
          : cleanedLines;

        if (finalLines.length > 0) {
          nodes.push({
            id: `srt_${idx}`,
            timestampStart: currentStart,
            timestampEnd: currentEnd,
            speaker: "Subtitle",
            japanese: [{ text: finalLines.join(' '), type: TokenType.CONTENT, groupId: -1 }],
            english: [],
            grammarNotes: []
          });
        }
      }
    }
    textBuffer = [];
    isCollecting = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(timestampRegex);

    if (match) {
      if (isCollecting) flush(nodes.length);
      
      currentStart = parseTimestampToSeconds(match[1]);
      currentEnd = parseTimestampToSeconds(match[2]);
      isCollecting = true;
      continue;
    }

    // Skip pure index numbers (1, 2, 3...) that appear before timestamps
    if (/^\d+$/.test(line) && !isCollecting) {
       continue; 
    }

    if (isCollecting) {
      if (line === '') {
        flush(nodes.length);
      } else {
        textBuffer.push(line);
      }
    }
  }
  
  if (isCollecting) flush(nodes.length);

  return nodes;
};

/**
 * Main Entry Point
 */
export const parseSRT = (fileContent: string): DialogueNode[] => {
  // 1. Check for ASS signature
  if (fileContent.includes('[Events]') || fileContent.includes('Dialogue:')) {
    return parseASS(fileContent);
  }
  
  // 2. Default to SRT/VTT
  return parseSRTOrVTT(fileContent);
};

export const parseSRTFile = (file: File): Promise<DialogueNode[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const nodes = parseSRT(content);
        resolve(nodes);
      } catch (err) {
        console.error(err);
        reject(new Error("Failed to parse subtitle structure."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read subtitle file."));
    reader.readAsText(file);
  });
};
