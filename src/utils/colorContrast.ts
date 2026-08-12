/** WCAG contrast helpers for tag/scope UI colors. */

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** White or near-black text for solid colored surfaces (WCAG AA for normal text). */
export function getContrastingForeground(backgroundHex: string): '#ffffff' | '#111111' {
  return contrastRatio('#ffffff', backgroundHex) >= 4.5 ? '#ffffff' : '#111111';
}

function mixToward(
  hex: string,
  target: { r: number; g: number; b: number },
  amount: number,
): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return toHex({
    r: rgb.r + (target.r - rgb.r) * amount,
    g: rgb.g + (target.g - rgb.g) * amount,
    b: rgb.b + (target.b - rgb.b) * amount,
  });
}

/**
 * Nudge a foreground color until it meets the minimum contrast against a background.
 * Used for tinted text/borders on dark surfaces.
 */
export function ensureContrastOnBackground(
  foregroundHex: string,
  backgroundHex: string,
  minRatio = 4.5,
): string {
  if (contrastRatio(foregroundHex, backgroundHex) >= minRatio) {
    return foregroundHex.startsWith('#')
      ? foregroundHex.toLowerCase()
      : `#${foregroundHex}`.toLowerCase();
  }

  const bgLum = relativeLuminance(backgroundHex);
  const towardWhite = bgLum < 0.5;
  const target = towardWhite
    ? { r: 255, g: 255, b: 255 }
    : { r: 17, g: 17, b: 17 };

  let best = foregroundHex;
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixToward(foregroundHex, target, step / 20);
    best = candidate;
    if (contrastRatio(candidate, backgroundHex) >= minRatio) {
      return candidate;
    }
  }

  return towardWhite ? '#ffffff' : '#111111';
}

/** Assumed dark panel surface behind filter/tag menus. */
export const TAG_UI_DARK_SURFACE = '#1a1d27';
