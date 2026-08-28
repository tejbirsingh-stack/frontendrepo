import type { MediaItem } from '../data/mockMedia';

/** Platform starter / global media — hosted on NOAH Cloud and read-only for users. */
export function isPlatformMediaAsset(
  item: Pick<MediaItem, 'globalMedia' | 'customMetadata'> | null | undefined,
): boolean {
  if (!item) return false;
  const meta = item.customMetadata as
    | { platformDefaultContentId?: unknown; seededFromPlatform?: unknown }
    | undefined;
  return Boolean(
    item.globalMedia || meta?.platformDefaultContentId || meta?.seededFromPlatform,
  );
}
