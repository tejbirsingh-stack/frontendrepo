import { useEffect, useRef, useCallback } from 'react';

export function useLibraryInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  rootMargin = '400px', // Load more when within 400px of the bottom
}: {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [loading, hasMore, onLoadMore]
  );

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null, // viewport
      rootMargin,
      threshold: 0.1,
    });

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleObserver, rootMargin]);

  return { sentinelRef };
}
