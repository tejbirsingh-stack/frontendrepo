import { formatVideoTimestamp } from './formatVideoTimestamp';
import { getMediaFileName } from './mediaFileName';
import type { MediaItem } from '../data/mockMedia';

export interface VideoStreamMetadata {
  duration?: string;
  durationSeconds?: number;
  resolution?: string;
  width?: number;
  height?: number;
  megapixels?: string;
  displayResolution?: string;
  aspectRatio?: string;
  orientation?: string;
  frameRate?: string;
  containerFormat?: string;
  videoCodec?: string;
  estimatedBitrate?: string;
  hasAudio?: string;
  scanType?: string;
  decodedFrames?: string;
  droppedFrames?: string;
}

const CONTAINER_LABELS: Record<string, string> = {
  mp4: 'MP4',
  m4v: 'M4V',
  webm: 'WebM',
  mov: 'QuickTime (MOV)',
  mkv: 'Matroska (MKV)',
  ogv: 'Ogg Video',
  avi: 'AVI',
};

const INFERRED_CODECS: Record<string, string> = {
  mp4: 'H.264 / AAC',
  m4v: 'H.264 / AAC',
  mov: 'H.264 / AAC',
  webm: 'VP9 / Opus',
  mkv: 'H.264 / AAC',
  ogv: 'Theora / Vorbis',
  avi: 'MPEG-4 / PCM',
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '—';

  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;
  const decimal = (width / height).toFixed(2);

  const commonRatios: [number, number, string][] = [
    [16, 9, '16:9'],
    [9, 16, '9:16'],
    [4, 3, '4:3'],
    [3, 4, '3:4'],
    [21, 9, '21:9'],
    [1, 1, '1:1'],
  ];

  for (const [w, h, label] of commonRatios) {
    if (Math.abs(width / height - w / h) < 0.02) {
      return `${label} (${decimal}:1)`;
    }
  }

  if (ratioW > 100 || ratioH > 100) {
    return `${decimal}:1`;
  }

  return `${ratioW}:${ratioH} (${decimal}:1)`;
}

function getOrientation(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '—';
  if (width > height) return 'Landscape';
  if (height > width) return 'Portrait';
  return 'Square';
}

function getContainerFormat(fileName: string): string | undefined {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return undefined;
  return CONTAINER_LABELS[extension] ?? extension.toUpperCase();
}

function getInferredCodec(fileName: string): string | undefined {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return undefined;
  return INFERRED_CODECS[extension];
}

export function estimateBitrate(sizeBytes: number, durationSeconds: number): string | undefined {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || sizeBytes <= 0) {
    return undefined;
  }

  const bitsPerSecond = (sizeBytes * 8) / durationSeconds;

  if (bitsPerSecond >= 1_000_000) {
    return `${(bitsPerSecond / 1_000_000).toFixed(2)} Mbps`;
  }

  return `${Math.round(bitsPerSecond / 1000)} kbps`;
}

function detectHasAudio(video: HTMLVideoElement): string {
  const mediaElement = video as HTMLVideoElement & {
    mozHasAudio?: boolean;
    webkitAudioDecodedByteCount?: number;
    audioTracks?: { length: number };
  };

  if (typeof mediaElement.mozHasAudio === 'boolean') {
    return mediaElement.mozHasAudio ? 'Yes' : 'No';
  }

  if (
    typeof mediaElement.webkitAudioDecodedByteCount === 'number' &&
    mediaElement.webkitAudioDecodedByteCount > 0
  ) {
    return 'Yes';
  }

  if (mediaElement.audioTracks && mediaElement.audioTracks.length > 0) {
    return mediaElement.audioTracks.length > 1
      ? `Yes (${mediaElement.audioTracks.length} tracks)`
      : 'Yes';
  }

  return 'Yes (assumed)';
}

export function extractVideoStreamMetadata(
  video: HTMLVideoElement,
  mediaItem: MediaItem,
): VideoStreamMetadata {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const durationSeconds = Number.isFinite(video.duration) ? video.duration : undefined;
  const fileName = getMediaFileName(mediaItem);

  const displayWidth = video.clientWidth;
  const displayHeight = video.clientHeight;

  return {
    duration: durationSeconds !== undefined ? formatVideoTimestamp(durationSeconds) : undefined,
    durationSeconds,
    resolution:
      width > 0 && height > 0 ? `${width} × ${height} px` : undefined,
    width: width > 0 ? width : undefined,
    height: height > 0 ? height : undefined,
    megapixels:
      width > 0 && height > 0
        ? `${((width * height) / 1_000_000).toFixed(2)} MP`
        : undefined,
    displayResolution:
      displayWidth > 0 && displayHeight > 0
        ? `${displayWidth} × ${displayHeight} px`
        : undefined,
    aspectRatio: width > 0 && height > 0 ? formatAspectRatio(width, height) : undefined,
    orientation: width > 0 && height > 0 ? getOrientation(width, height) : undefined,
    containerFormat: getContainerFormat(fileName),
    videoCodec: getInferredCodec(fileName),
    estimatedBitrate:
      durationSeconds !== undefined
        ? estimateBitrate(mediaItem.sizeBytes, durationSeconds)
        : undefined,
    hasAudio: detectHasAudio(video),
    scanType: 'Progressive',
  };
}

export function extractPlaybackQualityMetadata(
  video: HTMLVideoElement,
): Pick<VideoStreamMetadata, 'decodedFrames' | 'droppedFrames'> {
  if (typeof video.getVideoPlaybackQuality !== 'function') {
    return {};
  }

  const quality = video.getVideoPlaybackQuality();

  return {
    decodedFrames: quality.totalVideoFrames.toLocaleString(),
    droppedFrames: quality.droppedVideoFrames.toLocaleString(),
  };
}

export function getVideoQualityLabel(width?: number, height?: number): string | undefined {
  if (!width || !height) return undefined;

  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

  if (maxDim >= 3840 || minDim >= 2160) return '4K';
  if (maxDim >= 2560 || minDim >= 1440) return '2K';
  if (maxDim >= 1920 || minDim >= 1080) return 'Full HD';
  if (maxDim >= 1280 || minDim >= 720) return 'HD';
  return 'SD';
}

export function formatMeasuredFrameRate(fps: number): string {
  if (!Number.isFinite(fps) || fps <= 0) return '—';

  const rounded = Math.round(fps * 100) / 100;
  const commonRates = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];

  for (const rate of commonRates) {
    if (Math.abs(rounded - rate) < 0.35) {
      return `${rate} fps`;
    }
  }

  return `${rounded.toFixed(2)} fps`;
}

export function startFrameRateMeasurement(
  video: HTMLVideoElement,
  onFrameRate: (frameRate: string) => void,
): () => void {
  if (!('requestVideoFrameCallback' in video)) {
    return () => {};
  }

  let cancelled = false;
  let callbackId = 0;
  let frameCount = 0;
  let startMediaTime: number | null = null;

  const measure = (_now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => {
    if (cancelled) return;

    if (startMediaTime === null) {
      startMediaTime = metadata.mediaTime;
    } else {
      frameCount += 1;
      const elapsed = metadata.mediaTime - startMediaTime;

      if (elapsed >= 0.75 && frameCount >= 8) {
        onFrameRate(formatMeasuredFrameRate(frameCount / elapsed));
      }
    }

    callbackId = video.requestVideoFrameCallback(measure);
  };

  const start = () => {
    frameCount = 0;
    startMediaTime = null;
    callbackId = video.requestVideoFrameCallback(measure);
  };

  const stop = () => {
    if (callbackId) {
      video.cancelVideoFrameCallback(callbackId);
      callbackId = 0;
    }
  };

  const handlePlay = () => start();
  const handlePause = () => stop();
  const handleEnded = () => stop();

  video.addEventListener('play', handlePlay);
  video.addEventListener('pause', handlePause);
  video.addEventListener('ended', handleEnded);

  if (!video.paused && !video.ended) {
    start();
  }

  return () => {
    cancelled = true;
    stop();
    video.removeEventListener('play', handlePlay);
    video.removeEventListener('pause', handlePause);
    video.removeEventListener('ended', handleEnded);
  };
}
