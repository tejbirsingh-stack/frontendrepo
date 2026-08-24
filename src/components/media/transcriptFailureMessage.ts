export interface TranscriptFailureInfo {
  message: string;
  canRetry: boolean;
}

/**
 * Maps raw ASR / AI job error strings to user-facing copy and whether retry helps.
 */
export function mapTranscriptFailure(error: string | null | undefined): TranscriptFailureInfo {
  const raw = (error || '').toLowerCase();

  if (raw.includes('no audio stream')) {
    return {
      message: 'This video has no audio track, so a transcript can’t be generated.',
      canRetry: false,
    };
  }

  if (raw.includes('proxy assetfile missing')) {
    return {
      message: 'A playable version isn’t ready yet. Try again after processing finishes.',
      canRetry: true,
    };
  }

  if (raw.includes('presigned url')) {
    return {
      message: 'Couldn’t access the media file for transcription. Please retry.',
      canRetry: true,
    };
  }

  if (raw.includes('timed out')) {
    return {
      message: 'Transcription timed out. Please retry.',
      canRetry: true,
    };
  }

  if (raw.includes('assembly_api_key') || raw.includes('secret missing')) {
    return {
      message: 'Transcription isn’t available right now. Contact your administrator.',
      canRetry: false,
    };
  }

  return {
    message: 'Transcription failed. You can retry without affecting playback.',
    canRetry: true,
  };
}
