// src/services/transcriptService.ts (Final version using youtube-transcript-plus)

import { fetchTranscript as fetchTranscriptPlus } from 'youtube-transcript-plus';
import { extractVideoId } from '../utils/extractVideoId.js';

// --- Interfaces ---
interface TranscriptSegment {
  text: string;
  duration: number;
  offset: number;
}

export interface Transcript {
  raw: string;
  segments: TranscriptSegment[];
}

/**
 * Fetches a transcript using the robust 'youtube-transcript-plus' library.
 */
export async function fetchTranscript(url: string): Promise<Transcript> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL: Could not extract video ID.');
  }

  try {
    console.log(`Fetching transcript for video ID: ${videoId} using 'youtube-transcript-plus'...`);
    
    const transcriptData = await fetchTranscriptPlus(videoId, {
      lang: 'en', // Explicitly request English
    });

    if (!transcriptData || transcriptData.length === 0) {
      throw new Error('Library returned an empty transcript.');
    }

    // The library already returns the data in the format we need.
    const segments: TranscriptSegment[] = transcriptData;

    const rawTranscript = segments.map(segment => segment.text).join(' ');

    console.log(`✅ Successfully fetched transcript (${rawTranscript.length} characters).`);

    return {
      raw: rawTranscript,
      segments: segments,
    };

  } catch (error: any) {
    console.error(`Failed to fetch transcript for video ID ${videoId}:`, error);
    // The library throws specific errors, which we can pass along.
    throw new Error(`Failed to get transcript for ${videoId}: ${error.message}`);
  }
}