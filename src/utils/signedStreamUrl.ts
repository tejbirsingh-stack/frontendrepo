/**
 * Fetch a signed URL for media streaming
 * @param assetId - The asset ID
 * @param expiresInMinutes - URL expiration time in minutes (default: 5)
 * @returns Signed URL string
 */
export async function fetchSignedStreamUrl(assetId: string, expiresInMinutes: number = 5): Promise<string> {
  const { apiClient } = await import('../api/client');
  const { getAccessToken } = await import('../auth/authTokenBridge');

  /** Build a token-bearing fallback URL so the <video> element can still authenticate
   *  even when the signed URL generation fails.
   *  The backend's optionalAuthenticate middleware already accepts ?token=... as auth. */
  function tokenFallbackUrl(): string {
    const base = `/api/media/${encodeURIComponent(assetId)}/stream`;
    const token = getAccessToken();
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  }

  try {
    const url = `/api/media/${encodeURIComponent(assetId)}/signed-stream?expiresInMinutes=${expiresInMinutes}`;
    const response = await apiClient.get<{ success: boolean; signedUrl: string }>(url);

    const data = (response as any).data || response;

    if (data.success && data.signedUrl) {
      return data.signedUrl;
    }

    // Fallback to token-bearing stream URL if signed URL generation fails
    console.warn('Failed to generate signed URL, falling back to token stream');
    return tokenFallbackUrl();
  } catch (error) {
    console.error('Error fetching signed stream URL:', error);
    // Fallback to token-bearing stream URL on error
    return tokenFallbackUrl();
  }
}
