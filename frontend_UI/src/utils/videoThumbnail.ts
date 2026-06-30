function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function pickCaptureTime(duration: number, randomFrame: boolean, seekSeconds: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  const maxSeek = Math.max(0, duration - 0.05);
  if (randomFrame) {
    return Math.random() * maxSeek;
  }

  return Math.min(seekSeconds, maxSeek);
}

export interface CaptureVideoThumbnailOptions {
  /** Pick a random timestamp within the video. */
  randomFrame?: boolean;
  /** Used when randomFrame is false. Defaults to 1 second. */
  seekSeconds?: number;
}

export async function captureVideoThumbnail(
  videoSrc: string,
  options: CaptureVideoThumbnailOptions = {},
): Promise<{ thumbnail: string; duration: string }> {
  const { randomFrame = false, seekSeconds = 1 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = videoSrc;

    let settled = false;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
    };

    const finish = (
      result?: { thumbnail: string; duration: string },
      error?: Error,
    ) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (result) resolve(result);
      else reject(error ?? new Error('Failed to capture thumbnail'));
    };

    const captureFrame = () => {
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          finish(undefined, new Error('Could not create canvas context'));
          return;
        }
        context.drawImage(video, 0, 0, width, height);
        finish({
          thumbnail: canvas.toDataURL('image/jpeg', 0.85),
          duration: formatDuration(video.duration),
        });
      } catch (error) {
        finish(undefined, error instanceof Error ? error : new Error('Capture failed'));
      }
    };

    video.onloadedmetadata = () => {
      video.currentTime = pickCaptureTime(video.duration, randomFrame, seekSeconds);
    };

    video.onseeked = captureFrame;

    video.onerror = () => {
      finish(undefined, new Error('Failed to load video for thumbnail'));
    };
  });
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read image file'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

export async function getAudioDuration(audioSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = audioSrc;

    const cleanup = () => {
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
    };

    audio.onloadedmetadata = () => {
      const duration = formatDuration(audio.duration);
      cleanup();
      resolve(duration);
    };

    audio.onerror = () => {
      cleanup();
      reject(new Error('Failed to load audio metadata'));
    };
  });
}
