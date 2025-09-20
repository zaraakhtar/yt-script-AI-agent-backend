import { YoutubeTranscript } from 'youtube-transcript';
import { getSubtitles } from 'youtube-captions-scraper';
import { extractVideoId } from '../utils/extractVideoId.js';

interface TranscriptSegment {
  text: string;
  duration: number;
  offset: number;
}

export interface Transcript {
  raw: string;
  segments: TranscriptSegment[];
}

// NEW: Define the shape of the data from the fallback library
interface CaptionLine {
  text: string;
  dur: string;
  start: string;
}

/**
 * Fetches the transcript for a given YouTube URL using a primary and a fallback method.
 * @param url The YouTube URL.
 * @returns A promise that resolves to the transcript object.
 */
export async function fetchTranscript(url: string): Promise<Transcript> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL: Could not extract video ID.');
  }

  // --- Method 1: Try 'youtube-transcript' first ---
  try {
    console.log(`[Attempt 1/2] Fetching transcript for ${videoId} using 'youtube-transcript'`);
    const transcriptSegments: TranscriptSegment[] = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en'
    });

    if (!transcriptSegments || transcriptSegments.length === 0) {
      throw new Error('Primary library returned an empty transcript.');
    }
    
    const rawTranscript = transcriptSegments.map(segment => segment.text).join(' ');
    console.log(`✅ Success with primary library.`);
    
    return {
      raw: rawTranscript,
      segments: transcriptSegments,
    };

  } catch (primaryError: any) {
    console.warn(`⚠️ Primary library failed: ${primaryError.message}. Trying fallback...`);

    // --- Method 2: Fallback to 'youtube-captions-scraper' ---
    try {
      console.log(`[Attempt 2/2] Fetching transcript for ${videoId} using 'youtube-captions-scraper'`);
      const captions = await getSubtitles({ videoID: videoId, lang: 'en' });
      
      if (!captions || captions.length === 0) {
        throw new Error('Fallback library also returned an empty transcript.');
      }
      
      // THE FIX: We explicitly tell TypeScript the type of 'line'
      const transcriptSegments: TranscriptSegment[] = captions.map((line: CaptionLine) => ({
        text: line.text,
        duration: parseFloat(line.dur),
        offset: parseFloat(line.start)
      }));

      const rawTranscript = transcriptSegments.map(segment => segment.text).join(' ');
      console.log(`✅ Success with fallback library.`);

      return {
        raw: rawTranscript,
        segments: transcriptSegments,
      };

    } catch (fallbackError: any)
{
      console.error('❌ Both primary and fallback transcript methods failed.');
      throw new Error(`Could not retrieve transcript for this video: ${fallbackError.message}`);
    }
  }
}