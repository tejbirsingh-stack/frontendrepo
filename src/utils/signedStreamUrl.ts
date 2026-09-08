/**
 * Fetch a signed URL for media streaming
 * @param assetId - The asset ID
 * @param expiresInMinutes - URL expiration time in minutes (default: 5)
 * @returns Signed URL string
 */
export async function fetchSignedStreamUrl(assetId: string, expiresInMinutes: number = 5): Promise<string> {
  const { apiClient } = await import('../api/client');
  
  try {
    const url = `/api/media/${encodeURIComponent(assetId)}/signed-stream?expiresInMinutes=${expiresInMinutes}`;
    const response = await apiClient.get<{ success: boolean; signedUrl: string }>(url);
    
    const data = (response as any).data || response;
    
    if (data.success && data.signedUrl) {
      return data.signedUrl;
    }
    
    // Fallback to regular stream URL if signed URL generation fails
    console.warn('Failed to generate signed URL, falling back to regular stream');
    return `/api/media/${encodeURIComponent(assetId)}/stream`;
  } catch (error) {
    console.error('Error fetching signed stream URL:', error);
    // Fallback to regular stream URL on error
    return `/api/media/${encodeURIComponent(assetId)}/stream`;
  }
}
