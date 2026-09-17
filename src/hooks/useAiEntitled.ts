import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { env } from '../config/env';

/** Build-time env kill switch AND session/org plan entitlement. */
export function useAiEntitled(): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    return Boolean(env.aiEnabled && user?.organization?.aiEnabled === true);
  }, [user?.organization?.aiEnabled]);
}
