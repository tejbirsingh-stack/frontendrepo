import { MEDIA_DRAG_IDS_TYPE, MEDIA_DRAG_TYPE } from '../data/mockMedia';

export function setMediaDragPayload(event: React.DragEvent, mediaIds: string[]) {
  const ids = [...new Set(mediaIds)].filter(Boolean);
  const transfer = event.dataTransfer;
  if (ids.length === 0 || !transfer) return;

  transfer.setData(MEDIA_DRAG_IDS_TYPE, JSON.stringify(ids));
  transfer.setData(MEDIA_DRAG_TYPE, ids[0]);
  transfer.effectAllowed = 'move';
}

export function getMediaDragPayload(event: React.DragEvent | DragEvent): string[] {
  const transfer = event.dataTransfer;
  if (!transfer) return [];

  const multi = transfer.getData(MEDIA_DRAG_IDS_TYPE);
  if (multi) {
    try {
      const parsed = JSON.parse(multi) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
      }
    } catch {
      // fall through to single-id payload
    }
  }

  const single = transfer.getData(MEDIA_DRAG_TYPE);
  return single ? [single] : [];
}

export function hasMediaDragPayload(event: React.DragEvent | DragEvent): boolean {
  const transfer = event.dataTransfer;
  if (!transfer) return false;

  return (
    transfer.types.includes(MEDIA_DRAG_IDS_TYPE) ||
    transfer.types.includes(MEDIA_DRAG_TYPE)
  );
}
