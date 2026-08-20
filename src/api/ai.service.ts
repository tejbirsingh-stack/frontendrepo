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

export async function searchAiTranscriptRequest(q: string, page = 1): Promise<{
  success: boolean;
  items: AiSearchHitDto[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const params = new URLSearchParams({ q, page: String(page), pageSize: '24' });
  return apiClient.get(`/ai/search?${params.toString()}`);
}
