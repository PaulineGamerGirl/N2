
import { openDB, IDBPDatabase } from 'idb';
import { EpisodeMetadata } from '../types/immersionSchema';

const DB_NAME = 'NexusDictionary';
const FREQ_STORE = 'frequencies';
const LIBRARY_STORE = 'library';
const DB_VERSION = 2;

export interface WordMeta {
  rank: number;
  badge: string;
  jlpt: string;
}

class DictionaryService {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(FREQ_STORE)) {
          db.createObjectStore(FREQ_STORE);
        }
        if (!db.objectStoreNames.contains(LIBRARY_STORE)) {
          db.createObjectStore(LIBRARY_STORE);
        }
      },
    });
  }

  // --- Frequency Logic ---
  async importJPDB(file: File): Promise<number> {
    const text = await file.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse dictionary JSON", e);
      throw new Error("Invalid JSON file");
    }

    if (!Array.isArray(data)) {
      throw new Error("Dictionary format incorrect: Expected an array.");
    }

    const db = await this.db;
    const tx = db.transaction(FREQ_STORE, 'readwrite');
    const store = tx.objectStore(FREQ_STORE);
    
    let count = 0;
    
    // Schema Handling:
    // Case A (Simple): [ "Term", "freq", { "value": 123 } ]
    // Case B (Complex): [ "Term", "freq", { "reading": "...", "frequency": { "value": 123 } } ]
    
    for (const entry of data) {
      if (!Array.isArray(entry) || entry.length < 3) continue;

      const term = entry[0];
      const metadata = entry[2];
      let rank = 0;

      if (typeof metadata === 'object' && metadata !== null) {
        if (typeof metadata.value === 'number') {
          // Case A
          rank = metadata.value;
        } else if (metadata.frequency && typeof metadata.frequency.value === 'number') {
          // Case B
          rank = metadata.frequency.value;
        }
      }

      // Validation & Storage
      if (term && typeof term === 'string' && rank > 0) {
        await store.put(rank, term); 
        count++;
      }
    }

    await tx.done;
    console.log(`[DictionaryService] Successfully imported ${count} frequency entries.`);
    return count;
  }

  async getWordMeta(word: string): Promise<WordMeta | null> {
    const db = await this.db;
    const rank = await db.get(FREQ_STORE, word);
    
    if (rank === undefined || rank === null) return null;

    const numRank = Number(rank);
    let jlpt = 'Unknown';
    let badge = '⚪ Unranked';

    if (numRank <= 1500) {
      jlpt = 'N5/N4';
      badge = '🌟 Vital';
    } else if (numRank <= 5000) {
      jlpt = 'N3/N2';
      badge = '🟢 Common';
    } else if (numRank <= 15000) {
      jlpt = 'N1';
      badge = '🔵 Advanced';
    } else {
      jlpt = 'N1+';
      badge = '🟣 Rare';
    }

    return {
      rank: numRank,
      badge,
      jlpt
    };
  }

  async isHydrated(): Promise<boolean> {
    const db = await this.db;
    const count = await db.count(FREQ_STORE);
    return count > 0;
  }

  // --- Library Metadata Persistence ---
  async saveEpisodeMetadata(meta: EpisodeMetadata): Promise<void> {
    const db = await this.db;
    const key = `${meta.seriesId}_ep_${meta.episodeNumber}`;
    await db.put(LIBRARY_STORE, meta, key);
  }

  async getEpisodeMetadata(seriesId: string, episodeNumber: number): Promise<EpisodeMetadata | null> {
    const db = await this.db;
    const key = `${seriesId}_ep_${episodeNumber}`;
    return await db.get(LIBRARY_STORE, key) || null;
  }

  async deleteEpisodeMetadata(seriesId: string, episodeNumber: number): Promise<void> {
    const db = await this.db;
    const key = `${seriesId}_ep_${episodeNumber}`;
    await db.delete(LIBRARY_STORE, key);
  }

  /**
   * Fetches ALL stored metadata for backup.
   */
  async getAllEpisodesMetadata(): Promise<EpisodeMetadata[]> {
    const db = await this.db;
    return await db.getAll(LIBRARY_STORE);
  }

  /**
   * Fetches multiple episodes worth of metadata for export.
   */
  async getEpisodesMetadataBulk(seriesId: string, episodeNumbers: number[]): Promise<EpisodeMetadata[]> {
    const db = await this.db;
    const results: EpisodeMetadata[] = [];
    for (const num of episodeNumbers) {
      const key = `${seriesId}_ep_${num}`;
      const data = await db.get(LIBRARY_STORE, key);
      if (data) results.push(data);
    }
    return results;
  }

  /**
   * Injects multiple metadata objects into the vault during import.
   */
  async saveEpisodesMetadataBulk(items: EpisodeMetadata[]): Promise<void> {
    const db = await this.db;
    const tx = db.transaction(LIBRARY_STORE, 'readwrite');
    const store = tx.objectStore(LIBRARY_STORE);
    for (const item of items) {
      const key = `${item.seriesId}_ep_${item.episodeNumber}`;
      await store.put(item, key);
    }
    await tx.done;
  }

  async clearLibrary(): Promise<void> {
    const db = await this.db;
    await db.clear(LIBRARY_STORE);
  }
}

export const dictionaryService = new DictionaryService();
