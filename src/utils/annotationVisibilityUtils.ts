import type { AnnotationAccessGroup, AnnotationVisibility } from '../types/annotationVisibility';
import { DEFAULT_ANNOTATION_VISIBILITY } from '../types/annotationVisibility';

export function resolveAnnotationVisibility(
  visibility?: AnnotationVisibility,
): AnnotationVisibility {
  return visibility ?? DEFAULT_ANNOTATION_VISIBILITY;
}

export function getGroupName(
  groupId: string | undefined,
  groups: AnnotationAccessGroup[],
): string | null {
  if (!groupId) return null;
  return groups.find((group) => group.id === groupId)?.name ?? null;
}

export function getVisibilityLabel(
  visibility: AnnotationVisibility | undefined,
  groupId: string | undefined,
  groups: AnnotationAccessGroup[],
): string {
  const resolved = resolveAnnotationVisibility(visibility);
  if (resolved === 'group') {
    return getGroupName(groupId, groups) ?? 'Group';
  }
  if (resolved === 'private') return 'Private';
  return 'Public';
}
