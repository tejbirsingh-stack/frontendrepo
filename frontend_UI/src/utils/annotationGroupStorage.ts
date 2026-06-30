import type { AnnotationAccessGroup } from '../types/annotationVisibility';

const STORAGE_PREFIX = 'noah-annotation-groups:';

const DEFAULT_GROUPS: AnnotationAccessGroup[] = [
  {
    id: 'group-design',
    name: 'Design review',
    createdAt: Date.now(),
    memberIds: ['collab-current-user', 'collab-chandana', 'collab-manoj'],
  },
  {
    id: 'group-client',
    name: 'Client review',
    createdAt: Date.now(),
    memberIds: ['collab-current-user', 'collab-richa'],
  },
];

function normalizeGroup(group: AnnotationAccessGroup): AnnotationAccessGroup {
  return {
    ...group,
    memberIds: Array.isArray(group.memberIds) ? group.memberIds : [],
  };
}

export function loadAnnotationGroups(mediaId: string): AnnotationAccessGroup[] {
  if (typeof window === 'undefined') return DEFAULT_GROUPS.map(normalizeGroup);

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${mediaId}`);
    if (!raw) return DEFAULT_GROUPS.map(normalizeGroup);
    const parsed = JSON.parse(raw) as AnnotationAccessGroup[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_GROUPS.map(normalizeGroup);
    }
    return parsed.map(normalizeGroup);
  } catch {
    return DEFAULT_GROUPS.map(normalizeGroup);
  }
}

export function saveAnnotationGroups(mediaId: string, groups: AnnotationAccessGroup[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${mediaId}`, JSON.stringify(groups));
}

export function createAnnotationGroup(name: string, memberIds: string[]): AnnotationAccessGroup {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: Date.now(),
    memberIds: [...new Set(memberIds)],
  };
}
