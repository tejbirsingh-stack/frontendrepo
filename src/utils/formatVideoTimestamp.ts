export function formatVideoTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/** 
 * Player timecode as HH:MM:SS:FF (FF = Frame number 00–FPS-1).
 * Defaults to 24 FPS if fps parameter is missing or invalid.
 */
export function formatVideoTimecode(seconds: number, fps: number = 24): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const wholeSeconds = Math.floor(safe % 60);

  const effectiveFps = fps && Number.isFinite(fps) && fps > 0 ? fps : 24;
  const frameFraction = safe % 1;
  const frameNumber = Math.min(
    Math.floor(effectiveFps) - 1,
    Math.floor(frameFraction * effectiveFps + 0.00001),
  );

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    wholeSeconds.toString().padStart(2, '0'),
    frameNumber.toString().padStart(2, '0'),
  ].join(':');
}

/** Parses display labels like `0:05`, `1:58`, or `1:02:30` into seconds. */
export function parseMediaDurationLabel(value?: string | number): number | undefined {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'string' || !value.trim()) return undefined;

  const parts = value.trim().split(':').map((part) => Number(part));
  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) {
    return undefined;
  }

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
