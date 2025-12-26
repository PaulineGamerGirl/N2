
import JSZip from 'jszip';
import { MinedCard } from '../types/immersionSchema';

/**
 * Senior Data Engineer: Anki Sync Engine (Schema V2)
 * Targets Note Type with exactly: Word; Word Meaning; Sentence Field; Image Field; Audio Field
 */
export const exportToAnki = async (cards: MinedCard[], deckName: string = "NihongoNexus_Export") => {
  if (cards.length === 0) return;

  const zip = new JSZip();
  const csvRows: string[] = [];

  // Metadata headers (Anki ignores # lines)
  csvRows.push("#separator:Semicolon");
  csvRows.push("#html:true");
  csvRows.push("#columns:Word;Word Meaning;Sentence Field;Image Field;Audio Field");

  console.log(`[AnkiExport] Deploying Schema V2 for ${cards.length} nodes...`);

  for (const card of cards) {
    const timestamp = card.timestamp || Date.now();
    const shortId = card.id.split('-')[0];
    
    // 1. Filename Sanitization
    const safePrefix = (card.sourceTitle || 'nexus').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const audioFilename = `${safePrefix}_audio_${timestamp}_${shortId}.wav`;
    const imageFilename = `${safePrefix}_img_${timestamp}_${shortId}.jpg`;

    // 2. Binary Asset Fetching
    try {
      if (card.audio) {
        const audioRes = await fetch(card.audio);
        const audioBlob = await audioRes.blob();
        if (audioBlob.size > 0) zip.file(audioFilename, audioBlob);
      }

      if (card.image) {
        const imageRes = await fetch(card.image);
        const imageBlob = await imageRes.blob();
        if (imageBlob.size > 0) zip.file(imageFilename, imageBlob);
      }

      // 3. Optimized Sentence Field Construction
      // Merges the Japanese original and the full translation with a line break
      const sentenceField = `${card.back}<br><small style="color: #999">${card.fullTranslation || ''}</small>`;

      // 4. CSV Row Construction (Strict Order)
      // Col 1: Word
      // Col 2: Word Meaning (Specific definition)
      // Col 3: Sentence Field (Combined JP/EN)
      // Col 4: Image Field
      // Col 5: Audio Field
      const row = [
        card.front,
        card.translation,
        sentenceField.replace(/;/g, ','), 
        card.image ? `<img src="${imageFilename}">` : "",
        card.audio ? `[sound:${audioFilename}]` : ""
      ].join(';');
      
      csvRows.push(row);
    } catch (error) {
      console.error(`[AnkiExport] Critical fault at node ${card.id}:`, error);
    }
  }

  // 5. Finalize Bundle
  zip.file("deck.csv", csvRows.join('\n'));

  try {
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deckName}_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    console.log("[AnkiExport] Transmission Success.");
  } catch (error) {
    console.error("[AnkiExport] ZIP Compression Failed:", error);
    throw error;
  }
};
