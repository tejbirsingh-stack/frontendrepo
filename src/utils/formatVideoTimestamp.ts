export function formatVideoTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/** Player timecode as HH:MM:SS:MS (MS = centiseconds, 00–99). */
export function formatVideoTimecode(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const wholeSeconds = Math.floor(safe % 60);
  const centiseconds = Math.floor((safe % 1) * 100);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    wholeSeconds.toString().padStart(2, '0'),
    centiseconds.toString().padStart(2, '0'),
  ].join(':');
}

/** Parses display labels like `0:05`, `1:58`, or `1:02:30` into seconds. */
export function parseMediaDurationLabel(value?: string): number | undefined {
  if (!value?.trim()) return undefined;

  const parts = value.trim().split(':').map((part) => Number(part));
  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) {
    return undefined;
  }

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
