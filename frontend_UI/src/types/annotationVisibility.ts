export type AnnotationVisibility = 'public' | 'private' | 'group';

export interface AnnotationAccessGroup {
  id: string;
  name: string;
  createdAt: number;
  memberIds: string[];
}

export const DEFAULT_ANNOTATION_VISIBILITY: AnnotationVisibility = 'public';
