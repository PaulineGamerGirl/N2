
import { DialogueNode, TokenType } from '../types/immersionSchema';

/**
 * Converts SRT timestamp string (00:00:20,000) to total seconds (20.0).
 */
const srtTimeToSeconds = (timeStr: string): number => {
  const [time, ms] = timeStr.split(',');
  const [hrs, mins, secs] = time.split(':').map(parseFloat);
  return (hrs * 3600) + (mins * 60) + secs + (parseFloat(ms) / 1000);
};

/**
 * Parses raw SRT content into DialogueNode array.
 */
export const parseSRT = (fileContent: string): DialogueNode[] => {
  const nodes: DialogueNode[] = [];
  // Split by double newline which usually separates SRT blocks
  const blocks = fileContent.trim().split(/\n\s*\n/);

  const timeRegex = /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/;

  blocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim());
    if (lines.length < 3) return;

    const timeMatch = lines[1].match(timeRegex);
    if (!timeMatch) return;

    const start = srtTimeToSeconds(timeMatch[1]);
    const end = srtTimeToSeconds(timeMatch[2]);
    const text = lines.slice(2).join(' '); // Handle multi-line subs

    nodes.push({
      id: `srt_${index}`,
      timestampStart: start,
      timestampEnd: end,
      speaker: "Subtitle",
      // Since SRT is raw text, we wrap it in a default CONTENT token
      // Real morphological analysis would happen via Gemini later
      japanese: [{
        text: text,
        type: TokenType.CONTENT,
        groupId: -1 // Temporary ID until linked
      }],
      english: [], // Initially empty, can be populated via translation tools
      grammarNotes: []
    });
  });

  return nodes;
};

/**
 * Reads an SRT file as text and returns parsed DialogueNodes.
 */
export const parseSRTFile = (file: File): Promise<DialogueNode[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        resolve(parseSRT(content));
      } catch (err) {
        reject(new Error("Failed to parse subtitle structure."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read subtitle file."));
    reader.readAsText(file);
  });
};
