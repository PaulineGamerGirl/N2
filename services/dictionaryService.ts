
import { openDB, IDBPDatabase } from 'idb';
import { EpisodeMetadata } from '../types/immersionSchema';

const DB_NAME = 'NexusDictionary';
const FREQ_STORE = 'frequencies';
const LIBRARY_STORE = 'library';
const DB_VERSION = 2;

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
    const data = JSON.parse(text);
    const db = await this.db;
    const tx = db.transaction(FREQ_STORE, 'readwrite');
    const store = tx.objectStore(FREQ_STORE);
    let count = 0;
    for (const entry of data) {
      if (!Array.isArray(entry) || entry.length < 3) continue;
      await store.put(entry[2], entry[0]);
      count++;
    }
    await tx.done;
    return count;
  }

  async getWordMeta(word: string): Promise<number | null> {
    const db = await this.db;
    const rank = await db.get(FREQ_STORE, word);
    return rank !== undefined ? Number(rank) : null;
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
