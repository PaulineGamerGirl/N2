
/**
 * Origin Private File System (OPFS) Service
 * Provides persistent storage for large media files (videos) that survives page reloads.
 * This acts as a "Ghost" file handle, keeping the active episode ready without re-upload.
 */

export const opfsService = {
  /**
   * Saves a video file to the private file system.
   * Uses a standardized naming convention: {seriesId}_ep_{epNum}.mp4
   */
  async saveVideo(filename: string, file: File): Promise<void> {
    try {
      if (!navigator.storage?.getDirectory) return;
      
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
      console.log(`[OPFS] Cached video: ${filename}`);
    } catch (e) {
      console.warn("[OPFS] Save Failed (Quota exceeded or incognito mode):", e);
    }
  },

  /**
   * Retrieves a video file from storage if it exists.
   */
  async loadVideo(filename: string): Promise<File | null> {
    try {
      if (!navigator.storage?.getDirectory) return null;

      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(filename); // Throws if not found
      const file = await fileHandle.getFile();
      console.log(`[OPFS] Restored ghost handle: ${filename}`);
      return file;
    } catch (e) {
      // File not found is expected behavior for new episodes
      return null;
    }
  },

  /**
   * Deletes a specific video file (e.g., to free up space).
   */
  async deleteVideo(filename: string): Promise<void> {
    try {
      if (!navigator.storage?.getDirectory) return;
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(filename);
    } catch (e) {
      console.warn("[OPFS] Delete failed:", e);
    }
  },
  
  /**
   * Generates a standard filename key.
   */
  getKey(seriesId: string, epNum: number): string {
    return `${seriesId}_ep_${epNum}.mp4`;
  }
};
