import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CURRENT_USER } from '../constants/currentUser';
import type { CommentAuthor } from '../types/videoComments';

export function useActiveUser(): CommentAuthor {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
  } catch {
    user = null;
  }
  
  return useMemo(() => {
    if (user) {
      return {
        name: user.name || 'Unknown User',
        avatarUrl: undefined, // Currently we don't have user avatars in the DB schema
        initials: (user.name || '').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'
      };
    }
    return CURRENT_USER;
  }, [user]);
}
