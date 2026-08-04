import { DEFAULT_TAG_SCOPE_COLORS } from '../constants/tagColors';
import type { ManagedTag } from '../types/managedTag';

const STORAGE_KEY = 'noah-managed-tags';

const initialManagedTags: ManagedTag[] = [
  {
    id: 'tag-company-brand',
    name: 'brand',
    scope: 'company',
    workspaceId: null,
    parentId: null,
    color: DEFAULT_TAG_SCOPE_COLORS.company,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'tag-company-brand-social',
    name: 'social-media',
    scope: 'company',
    workspaceId: null,
    parentId: 'tag-company-brand',
    parentName: 'brand',
    color: DEFAULT_TAG_SCOPE_COLORS.company,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'tag-company-project',
    name: 'project',
    scope: 'company',
    workspaceId: null,
    parentId: null,
    color: DEFAULT_TAG_SCOPE_COLORS.company,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'tag-personal-important',
    name: 'important',
    scope: 'personal',
    workspaceId: null,
    parentId: null,
    color: DEFAULT_TAG_SCOPE_COLORS.personal,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'tag-personal-archived',
    name: 'archived',
    scope: 'personal',
    workspaceId: null,
    parentId: null,
    color: DEFAULT_TAG_SCOPE_COLORS.personal,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'tag-project-noah-campaign',
    name: 'campaign',
    scope: 'project',
    workspaceId: 'noah',
    parentId: null,
    color: DEFAULT_TAG_SCOPE_COLORS.project,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'tag-project-noah-review',
    name: 'review',
    scope: 'project',
    workspaceId: 'noah',
    parentId: 'tag-project-noah-campaign',
    parentName: 'campaign',
    color: DEFAULT_TAG_SCOPE_COLORS.project,
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'tag-project-client-deliverable',
    name: 'deliverable',
    scope: 'project',
    workspaceId: 'client-media',
    parentId: null,
    color: DEFAULT_TAG_SCOPE_COLORS.project,
    createdAt: '2025-06-01T10:00:00Z',
  },
];

function sanitizeManagedTags(tags: ManagedTag[]): ManagedTag[] {
  return tags
    .filter(
      (tag) =>
        tag &&
        typeof tag.id === 'string' &&
        typeof tag.name === 'string' &&
        typeof tag.scope === 'string' &&
        typeof tag.color === 'string',
    )
    .map((tag) => ({
      ...tag,
      name: tag.name.trim().toLowerCase(),
      workspaceId: tag.scope === 'project' ? tag.workspaceId : null,
      parentId: tag.parentId || null,
      color: tag.color || DEFAULT_TAG_SCOPE_COLORS[tag.scope],
    }));
}

export function loadManagedTags(): ManagedTag[] {
  if (typeof window === 'undefined') return [...initialManagedTags];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...initialManagedTags];

    const parsed = JSON.parse(raw) as ManagedTag[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...initialManagedTags];

    return sanitizeManagedTags(parsed);
  } catch {
    return [...initialManagedTags];
  }
}

export function saveManagedTags(tags: ManagedTag[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}
