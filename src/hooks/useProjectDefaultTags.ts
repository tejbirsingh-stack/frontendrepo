import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export interface ProjectDefaultTag {
  id: string;
  name: string;
  color: string | null;
  scope: string;
  parentId: string | null;
  parentName?: string | null;
  ancestors?: Array<{ id: string; name: string }>;
}

/**
 * Fetches the default tags configured for a project.
 * Returns an empty array when projectId is null/undefined.
 */
export function useProjectDefaultTags(projectId: string | null | undefined): {
  defaultTags: ProjectDefaultTag[];
  loading: boolean;
} {
  const [defaultTags, setDefaultTags] = useState<ProjectDefaultTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setDefaultTags([]);
      return;
    }

    setLoading(true);
    apiClient
      .get<any>(`/tags/projects/${projectId}/default-tags`)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        
        // Flatten tags + their ancestors into a single unique array
        const allTagsMap = new Map<string, ProjectDefaultTag>();
        list.forEach((tag: ProjectDefaultTag) => {
          allTagsMap.set(tag.id, tag);
          if (tag.ancestors && Array.isArray(tag.ancestors)) {
            tag.ancestors.forEach((ancestor) => {
              if (!allTagsMap.has(ancestor.id)) {
                // Ensure ancestors conform to ProjectDefaultTag structure for UI rendering
                allTagsMap.set(ancestor.id, {
                  ...ancestor,
                  // Fallback values for rendering
                  color: (ancestor as any).color ?? null,
                  scope: (ancestor as any).scope ?? 'company',
                  parentId: null,
                });
              }
            });
          }
        });
        
        setDefaultTags(Array.from(allTagsMap.values()));
      })
      .catch(() => setDefaultTags([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  return { defaultTags, loading };
}
