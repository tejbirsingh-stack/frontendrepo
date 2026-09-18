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

/**
 * Open a document stream in a new tab using a signed/token-bearing URL.
 * Opens a blank tab synchronously (keeps the user-gesture), then navigates
 * after the signed URL is fetched — avoids popup blockers and false
 * "allow pop-ups" toasts from window.open(..., 'noopener') returning null.
 */
export async function openDocumentInNewTab(
  assetId: string,
  expiresInMinutes: number = 30,
): Promise<void> {
  const tab = window.open('about:blank', '_blank');
  if (!tab) {
    console.error('Failed to open document: pop-up blocked');
    return;
  }

  try {
    const signedUrl = await fetchSignedStreamUrl(assetId, expiresInMinutes);
    tab.opener = null;
    tab.location.replace(signedUrl);
  } catch (error) {
    console.error('Failed to open document stream:', error);
    tab.close();
  }
}
