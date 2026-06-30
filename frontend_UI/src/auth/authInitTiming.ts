import { AUTH_INIT_MIN_SKELETON_MS } from '../constants/loading';

export async function waitForMinimumSkeletonTime(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = AUTH_INIT_MIN_SKELETON_MS - elapsed;
  if (remaining <= 0) return;
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}
