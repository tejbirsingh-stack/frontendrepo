import { Suspense, type ReactNode } from 'react';

export default function PageSuspense({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
