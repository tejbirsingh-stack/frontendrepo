import type { AnnotationSnapshot } from '../types/annotationSnapshot';

export function hasAnnotationContent(snapshot: AnnotationSnapshot): boolean {
  return (
    snapshot.comments.length > 0 ||
    snapshot.drawings.length > 0 ||
    snapshot.shapes.length > 0 ||
    snapshot.stamps.length > 0 ||
    snapshot.history.length > 0
  );
}
