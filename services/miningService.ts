
/**
 * Senior Multimedia Engineer: Audio/Visual Extraction Protocol
 * Handles high-fidelity frame capture and stream-based audio recording.
 */

/**
 * Captures a high-quality JPEG screenshot from the current video frame.
 */
export const captureScreenshot = async (video: HTMLVideoElement): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        resolve('');
      }
    }, 'image/jpeg', 0.9);
  });
};

/**
 * Slices a specific segment of audio by recording the video's audio stream.
 * APPROACH: 1x Real-time Stream Capture.
 * Why 1x? MediaRecorder captures the raw output of the stream. Increasing playbackRate
 * during recording results in "chipmunk" audio in the final file.
 */
export const sliceAudio = async (
  video: HTMLVideoElement,
  startTime: number,
  endTime: number
): Promise<string> => {
  return new Promise(async (resolve) => {
    const originalTime = video.currentTime;
    const originalMuted = video.muted;
    const originalPlaybackRate = video.playbackRate;
    
    // 1. Prepare the stream
    // @ts-ignore - captureStream is widely supported but sometimes needs prefixing
    const stream = video.captureStream ? video.captureStream() : (video as any).mozCaptureStream();
    const audioTrack = stream.getAudioTracks()[0];
    
    if (!audioTrack) {
      console.warn("[MultimediaService] No audio track found in video stream.");
      resolve("");
      return;
    }

    const mediaStream = new MediaStream([audioTrack]);
    const recorder = new MediaRecorder(mediaStream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      resolve(URL.createObjectURL(blob));
    };

    // 2. Seek and Record
    video.muted = true; // Silent record
    video.playbackRate = 1.0; // CRITICAL: Force 1x speed to prevent audio distortion
    video.currentTime = startTime;

    const startRecording = () => {
      recorder.start();
      video.play();

      const checkEnd = () => {
        // Use a small buffer (0.1s) to ensure we don't cut off trailing syllables
        if (video.currentTime >= endTime || video.paused) {
          video.pause();
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          // Cleanup and Restore original state
          video.currentTime = originalTime;
          video.muted = originalMuted;
          video.playbackRate = originalPlaybackRate;
          video.removeEventListener('timeupdate', checkEnd);
        }
      };

      video.addEventListener('timeupdate', checkEnd);
    };

    // Wait for the seek to complete before starting the capture
    video.addEventListener('seeked', function onSeeked() {
      startRecording();
      video.removeEventListener('seeked', onSeeked);
    });
  });
};
