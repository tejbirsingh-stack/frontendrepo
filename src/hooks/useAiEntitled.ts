import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { env } from '../config/env';

/** Build-time env kill switch AND session/org plan entitlement. */
export function useAiEntitled(): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!env.aiEnabled) return false;
    if (user?.organization?.aiEnabled === false) return false;
    return true;
  }, [user?.organization?.aiEnabled]);
}
