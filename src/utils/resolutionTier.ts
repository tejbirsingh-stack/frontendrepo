export function getResolutionTier(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) {
    return 'N/A';
  }

  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

  if (maxDim >= 3840 || minDim >= 2160) {
    return '4K UHD';
  }
  if (maxDim >= 2560 || minDim >= 1440) {
    return '2K QHD';
  }
  if (maxDim >= 1920 || minDim >= 1080) {
    return '1080p HD';
  }
  if (maxDim >= 1280 || minDim >= 720) {
    return '720p HD';
  }
  return 'SD';
}

export function calculateMegapixels(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) {
    return 'N/A';
  }
  const mp = (width * height) / 1000000;
  return `${mp.toFixed(2)} MP`;
}

export function deriveOrientation(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) {
    return 'N/A';
  }
  if (width === height) return 'Square';
  return width > height ? 'Landscape' : 'Portrait';
}
