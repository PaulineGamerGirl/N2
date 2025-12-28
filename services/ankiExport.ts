
import JSZip from 'jszip';
import { MinedCard } from '../types/immersionSchema';

/**
 * Senior Data Engineer: Anki Sync Engine (Schema V3)
 * Targets Note Type with exactly: 
 * Word; Word Meaning; Sentence Field; Image Field; Audio Field; Tags
 */
export const exportToAnki = async (cards: MinedCard[], deckName: string = "NihongoNexus_Export") => {
  if (cards.length === 0) return;

  const zip = new JSZip();
  const csvRows: string[] = [];

  // Metadata headers (Anki ignores # lines, but good for docs)
  csvRows.push("#separator:Semicolon");
  csvRows.push("#html:true");
  csvRows.push("#columns:Word;Word Meaning;Sentence Field;Image Field;Audio Field;Tags");

  console.log(`[AnkiExport] Deploying Schema V3 with Tagging for ${cards.length} nodes...`);

  for (const card of cards) {
    const timestamp = card.timestamp || Date.now();
    const shortId = card.id.split('-')[0];
    
    // 1. Filename Sanitization
    const safeSource = (card.sourceTitle || 'nexus').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const audioFilename = `${safeSource}_audio_${timestamp}_${shortId}.wav`;
    const imageFilename = `${safeSource}_img_${timestamp}_${shortId}.jpg`;

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

      // 3. Sentence Field (JP + EN)
      const sentenceField = `${card.back}<br><small style="color: #999">${card.fullTranslation || ''}</small>`;

      // 4. Hierarchical Tag Generation
      // Tags: NihongoNexus Immersion SeriesName SeriesName::Ep_XX
      const cleanSeriesTag = card.sourceTitle ? card.sourceTitle.replace(/\s+/g, '_') : 'Unknown_Series';
      const tags = ['NihongoNexus', 'Immersion', cleanSeriesTag];
      
      if (card.sourceEpisode) {
        // Anki uses :: for hierarchical tags (e.g., Death_Note::Ep_01)
        tags.push(`${cleanSeriesTag}::Ep_${card.sourceEpisode.toString().padStart(2, '0')}`);
      }

      const tagField = tags.join(' ');

      // 5. CSV Row Construction
      const row = [
        card.front.replace(/;/g, ','),
        card.translation.replace(/;/g, ','),
        sentenceField.replace(/;/g, ','), 
        card.image ? `<img src="${imageFilename}">` : "",
        card.audio ? `[sound:${audioFilename}]` : "",
        tagField
      ].join(';');
      
      csvRows.push(row);
    } catch (error) {
      console.error(`[AnkiExport] Critical fault at node ${card.id}:`, error);
    }
  }

  // 6. Finalize Bundle
  zip.file("deck.csv", csvRows.join('\n'));

  try {
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deckName}_${new Date().toISOString().split('T')[0]}.apkg.zip`; // Hinting it's for Anki
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
