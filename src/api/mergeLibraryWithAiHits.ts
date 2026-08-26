import { getMediaAssetByIdRequest } from './media.service';
import { searchAiRequest, type AiSearchHitDto } from './ai.service';
import type { MediaItem, MediaType } from '../data/mockMedia';

function stampHit(item: MediaItem, hit: AiSearchHitDto): MediaItem {
  return {
    ...item,
    searchMatch: {
      matchType: hit.matchType,
      snippet: hit.snippet,
      startMs: hit.startMs,
    },
    summary: hit.snippet || item.summary,
  };
}

function dtoToMediaItem(id: string, dto: Awaited<ReturnType<typeof getMediaAssetByIdRequest>>, hit: AiSearchHitDto): MediaItem {
  const type = (dto.type || 'video') as MediaType;
  return stampHit(
    {
      id,
      title: dto.name,
      type,
      workspaceId: dto.workspaceId || '',
      createdAt: dto.uploadDate,
      sizeBytes: dto.size || 0,
      storageProvider: 'b2',
      thumbnail: dto.thumbnail || undefined,
      url: dto.url,
      videoSrc: dto.url,
    },
    hit,
  );
}

export async function mergeLibraryWithAiHits(items: MediaItem[], q: string): Promise<MediaItem[]> {
  const query = q.trim();
  if (query.length <= 2) {
    return items;
  }

  let hits: AiSearchHitDto[] = [];
  try {
    const result = await searchAiRequest(query);
    hits = result.items || [];
  } catch {
    return items;
  }

  if (hits.length === 0) {
    return items.map((item) => ({ ...item, searchMatch: undefined }));
  }

  const hitById = new Map(hits.map((hit) => [hit.assetId, hit]));
  const stamped = items.map((item) => {
    const hit = hitById.get(item.id);
    return hit ? stampHit(item, hit) : { ...item, searchMatch: undefined };
  });

  const present = new Set(items.map((item) => item.id));
  const missingHits = hits.filter((hit) => !present.has(hit.assetId)).slice(0, 12);
  const extras = (
    await Promise.all(
      missingHits.map(async (hit) => {
        try {
          const dto = await getMediaAssetByIdRequest(hit.assetId);
          return dtoToMediaItem(hit.assetId, dto, hit);
        } catch {
          return null;
        }
      }),
    )
  ).filter((item): item is MediaItem => Boolean(item));

  const foldersAndProjects = stamped.filter((item) => item.type === 'folder' || item.isProject);
  const assets = stamped.filter((item) => item.type !== 'folder' && !item.isProject);
  const matched = assets.filter((item) => item.searchMatch);
  const unmatched = assets.filter((item) => !item.searchMatch);

  return [...matched, ...extras, ...unmatched, ...foldersAndProjects];
}
