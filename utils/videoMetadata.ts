
/**
 * Headless Metadata Extraction
 * Uses a temporary video element to determine dimensions and duration.
 */
export const getVideoMetadata = (file: File): Promise<{ width: number; height: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const dimensions = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      };
      cleanup();
      resolve(dimensions);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video metadata. The file might be corrupt or unsupported.'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Converts a browser File to a Base64 string for Gemini API ingestion.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};
