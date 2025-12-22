
export interface ParsedGrammarPoint {
  id: string;
  point: string;
  meaning: string;
  sentences: string;
}

export const parseAnkiExport = (text: string): Record<string, ParsedGrammarPoint[]> => {
  const lines = text.split('\n');
  const database: Record<string, ParsedGrammarPoint[]> = {};

  lines.forEach(line => {
    // Basic CSV/TSV handling - Split by tab (Anki default)
    const cols = line.split('\t');
    if (cols.length < 2) return;

    // Header Mapping based on prompt: 
    // Index 0: Grammar Point
    // Index 1: Explanation/Meaning
    // Index 2: Sentences (Optional)
    // Index 6: Tags (Crucial) -> e.g., "Genki::Chapter_01" or just "Chapter_17"

    // Sanitize
    const point = cols[0]?.trim();
    const meaning = cols[1]?.trim();
    const sentences = cols[2]?.trim() || '';
    const tagString = cols[6]?.trim() || ''; 

    if (!point || !tagString) return;

    // Logic to determine uniqueId (e.g. 'genki1_1')
    let moduleId = '';
    let chapterNum = 0;
    const lowerTag = tagString.toLowerCase();

    // Extract number
    const numMatch = lowerTag.match(/(\d+)/);
    if (numMatch) {
      chapterNum = parseInt(numMatch[1], 10);
    }

    if (chapterNum === 0) return;

    // Map to Module
    if (lowerTag.includes('genki')) {
        if (chapterNum <= 12) moduleId = 'genki1';
        else if (chapterNum <= 23) moduleId = 'genki2';
    } else if (lowerTag.includes('quartet')) {
        if (chapterNum <= 6) moduleId = 'quartet1';
        else if (chapterNum <= 12) moduleId = 'quartet2';
    } else {
        // Fallback: If tag just says "Chapter 1", assume Genki 1.
        // If tag says "Chapter 13", assume Genki 2.
        if (chapterNum <= 12) moduleId = 'genki1';
        else if (chapterNum <= 23) moduleId = 'genki2';
    }

    if (moduleId) {
      const uniqueId = `${moduleId}_${chapterNum}`;
      
      if (!database[uniqueId]) {
        database[uniqueId] = [];
      }

      database[uniqueId].push({
        id: Math.random().toString(36).substr(2, 9),
        point,
        meaning,
        sentences
      });
    }
  });

  return database;
};
