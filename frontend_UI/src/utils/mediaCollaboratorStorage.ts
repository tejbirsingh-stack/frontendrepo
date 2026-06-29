import { CURRENT_USER, withCurrentUserProfile } from '../constants/currentUser';
import { cv, palette } from '../theme/cssVars';
import type { MediaCollaborator } from '../types/mediaCollaborator';

const storageKey = (mediaId: string) => `noah-media-collaborators:${mediaId}`;

const defaultCollaborators: MediaCollaborator[] = [
  {
    id: 'collab-current-user',
    name: CURRENT_USER.name,
    email: CURRENT_USER.email,
    initials: CURRENT_USER.initials,
    avatarUrl: CURRENT_USER.avatarUrl,
    isCurrentUser: true,
  },
  {
    id: 'collab-chandana',
    name: 'Chandana Neelagiri',
    email: 'chandana.neelagiri@mtxb2b.com',
    initials: 'CN',
    avatarColor: cv.indigo,
  },
  {
    id: 'collab-manoj',
    name: 'Manoj Reddy',
    email: 'manoj.reddy@mtxb2b.com',
    initials: 'MR',
    avatarColor: palette.green,
  },
  {
    id: 'collab-richa',
    name: 'Richa Agarwal',
    email: 'richa.agarwal@mtxb2b.com',
    initials: 'RA',
    avatarColor: palette.pink,
  },
];

function sanitizeCollaborators(collaborators: MediaCollaborator[]): MediaCollaborator[] {
  const seen = new Set<string>();

  return collaborators.filter((collaborator) => {
    if (!collaborator?.email || !collaborator.name) return false;
    const email = collaborator.email.trim().toLowerCase();
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

export function loadMediaCollaborators(mediaId: string): MediaCollaborator[] {
  if (typeof window === 'undefined') return [...defaultCollaborators];

  try {
    const raw = window.localStorage.getItem(storageKey(mediaId));
    if (!raw) return [...defaultCollaborators];

    const parsed = JSON.parse(raw) as MediaCollaborator[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...defaultCollaborators];

    return sanitizeCollaborators(parsed).map((collaborator) =>
      withCurrentUserProfile(collaborator),
    );
  } catch {
    return [...defaultCollaborators];
  }
}

export function saveMediaCollaborators(mediaId: string, collaborators: MediaCollaborator[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(storageKey(mediaId), JSON.stringify(collaborators));
}

export function createCollaboratorFromInvite(name: string, email: string): MediaCollaborator {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const initials = trimmedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || trimmedEmail[0]?.toUpperCase() || '?';

  return {
    id: `collab-${Date.now()}`,
    name: trimmedName,
    email: trimmedEmail,
    initials,
    avatarColor: cv.slateAvatar,
  };
}

export function formatJoinedNames(collaborators: MediaCollaborator[]): string {
  const names = collaborators.map((person) => person.name);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;

  const leading = names.slice(0, -1).join(', ');
  return `${leading}, and ${names[names.length - 1]}`;
}
