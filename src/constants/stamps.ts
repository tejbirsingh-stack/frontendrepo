import type { CustomStamp, CustomStampId } from '../types/customStamps';

export type OuterStampId =
  | 'thumbs-up'
  | 'plus-one'
  | 'star'
  | 'question'
  | 'thumbs-down'
  | 'heart';

export type InnerStampId = 'laugh' | 'pray' | 'fire' | 'eyes' | 'ok';

export type BuiltinStampId = OuterStampId | InnerStampId;

export type StampId = BuiltinStampId | CustomStampId;

export function isCustomStampId(stampId: StampId | undefined): stampId is CustomStampId {
  return typeof stampId === 'string' && stampId.startsWith('custom-');
}

export const DEFAULT_STAMP_ID: StampId = 'thumbs-up';

export const outerStamps: { id: OuterStampId; label: string }[] = [
  { id: 'thumbs-up', label: 'Thumbs up' },
  { id: 'plus-one', label: '+1' },
  { id: 'star', label: 'Star' },
  { id: 'question', label: 'Question' },
  { id: 'thumbs-down', label: 'Thumbs down' },
  { id: 'heart', label: 'Heart' },
];

export const innerStamps: { id: InnerStampId; label: string; emoji: string }[] = [
  { id: 'laugh', label: 'Laugh', emoji: '😂' },
  { id: 'pray', label: 'Folded hands', emoji: '🙏' },
  { id: 'fire', label: 'Fire', emoji: '🔥' },
  { id: 'eyes', label: 'Eyes', emoji: '👀' },
  { id: 'ok', label: 'OK', emoji: '👌' },
];

export function getStampLabel(stampId: StampId, customStamp: CustomStamp | null = null): string {
  if (isCustomStampId(stampId)) {
    return customStamp?.id === stampId ? customStamp.label : 'Custom stamp';
  }

  return (
    innerStamps.find((stamp) => stamp.id === stampId)?.label ??
    outerStamps.find((stamp) => stamp.id === stampId)?.label ??
    'Stamp'
  );
}

export function getStampEmoji(
  stampId: StampId,
  customStamp: CustomStamp | null = null,
  fallbackEmoji?: string,
): string | null {
  if (fallbackEmoji) return fallbackEmoji;

  if (isCustomStampId(stampId)) {
    return customStamp?.id === stampId ? customStamp.emoji : null;
  }

  return innerStamps.find((stamp) => stamp.id === stampId)?.emoji ?? null;
}

export function getStampSummary(
  stampId: StampId,
  customStamp: CustomStamp | null = null,
  fallbackEmoji?: string,
): string {
  const label = getStampLabel(stampId, customStamp);
  if (isCustomStampId(stampId)) {
    const emoji = getStampEmoji(stampId, customStamp, fallbackEmoji);
    return emoji ? `${emoji} stamp added` : `${label} added`;
  }

  return `${label} stamp added`;
}
