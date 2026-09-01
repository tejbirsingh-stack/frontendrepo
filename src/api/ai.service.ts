import { apiClient } from './client';

export interface TranscriptSegmentDto {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  ordinal: number;
}

export interface TranscriptResponseDto {
  success: boolean;
  assetId: string;
  status: string;
  asr?: string;
  error?: string | null;
  segments: TranscriptSegmentDto[];
}

export interface AiStatusResponseDto {
  success: boolean;
  assetId: string;
  status: string;
  steps: Record<string, string>;
  error: string | null;
  aiEnabled: boolean;
}

export interface AiSearchHitDto {
  assetId: string;
  score: number;
  matchType: string;
  startMs?: number;
  endMs?: number;
  snippet?: string;
}

export async function getTranscriptRequest(assetId: string): Promise<TranscriptResponseDto> {
  return apiClient.get<TranscriptResponseDto>(`/ai/assets/${encodeURIComponent(assetId)}/transcript`);
}

export async function getAiStatusRequest(assetId: string): Promise<AiStatusResponseDto> {
  return apiClient.get<AiStatusResponseDto>(`/ai/assets/${encodeURIComponent(assetId)}/status`);
}

export async function retryAiAnalyzeRequest(assetId: string, force = true): Promise<{ success: boolean; status: string }> {
  return apiClient.post(`/ai/assets/${encodeURIComponent(assetId)}/retry`, { force });
}

export async function searchAiRequest(q: string, page = 1): Promise<{
  success: boolean;
  items: AiSearchHitDto[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const params = new URLSearchParams({ q, page: String(page), pageSize: '24' });
  return apiClient.get(`/ai/search?${params.toString()}`);
}

export interface AiHighlightsResponseDto {
  success: boolean;
  assetId: string;
  status: string;
  summary: string | null;
  tags: string[];
  error?: string | null;
}

export async function getAiHighlightsRequest(assetId: string): Promise<AiHighlightsResponseDto> {
  return apiClient.get(`/ai/assets/${encodeURIComponent(assetId)}/highlights`);
}

export async function listAiTagsRequest(): Promise<{ success: boolean; tags: string[] }> {
  return apiClient.get('/ai/tags');
}

export interface AiPersonDto {
  id: string;
  viFaceId: string | null;
  displayLabel: string;
  startMs: number;
  endMs: number;
  thumbnailUrl: string | null;
  ordinal: number;
}

export interface AiSceneDto {
  id: string;
  label: string;
  description: string | null;
  startMs: number;
  endMs: number;
  confidence: number | null;
  ordinal: number;
}

export async function getAiPeopleRequest(
  assetId: string,
): Promise<{ success: boolean; assetId: string; people: AiPersonDto[] }> {
  return apiClient.get(`/ai/assets/${encodeURIComponent(assetId)}/people`);
}

export async function getAiScenesRequest(
  assetId: string,
): Promise<{ success: boolean; assetId: string; scenes: AiSceneDto[] }> {
  return apiClient.get(`/ai/assets/${encodeURIComponent(assetId)}/scenes`);
}

/** @deprecated Use searchAiRequest */
export const searchAiTranscriptRequest = searchAiRequest;
