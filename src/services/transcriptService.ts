import { Innertube } from 'youtubei.js';
import xml2js from 'xml2js';
import { extractVideoId } from '../utils/extractVideoId.js';

// Polyfill fetch for Node.js if not available
// Remove/comment this if you already have fetch globally available
if (typeof fetch === 'undefined') {
  // @ts-ignore
  global.fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  raw: string;
  segments: TranscriptSegment[];
}

export class TranscriptDisabledError extends Error {
  constructor(videoId: string) {
    super(`Captions/transcripts are not available for video: ${videoId}`);
    this.name = 'TranscriptDisabledError';
  }
}

export async function fetchTranscript(videoIdOrUrl: string): Promise<TranscriptResult> {
  try {
    const videoId = extractVideoId(videoIdOrUrl);
    
    // Create YouTube instance
    const yt = await Innertube.create();
    
    // Get video info
    const info = await yt.getInfo(videoId);
    
    if (!info.captions || !info.captions.caption_tracks?.length) {
      throw new TranscriptDisabledError(videoId);
    }

    // Find English captions or use first available
    let captionTrack = info.captions.caption_tracks.find(
      track => track.language_code === 'en' || track.language_code?.startsWith('en')
    );
    
    if (!captionTrack) {
      captionTrack = info.captions.caption_tracks[0];
    }

    if (!captionTrack?.base_url) {
      throw new TranscriptDisabledError(videoId);
    }

    // Fetch caption XML
    const response: any = await fetch(captionTrack.base_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.statusText}`);
    }

    const xmlContent = await response.text();
    
    // Parse XML to get transcript segments
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);
    
    if (!result.transcript?.text) {
      throw new TranscriptDisabledError(videoId);
    }

    const segments: TranscriptSegment[] = [];
    let rawText = '';

    for (const textNode of result.transcript.text) {
      const text = textNode._ || textNode || '';
      const start = parseFloat(textNode.$.start || '0');
      const duration = parseFloat(textNode.$.dur || '0');
      
      if (text.trim()) {
        // Clean up text (remove HTML entities, extra spaces)
        const cleanText = text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();

        segments.push({
          text: cleanText,
          start,
          duration
        });

        rawText += cleanText + ' ';
      }
    }

    if (!rawText.trim()) {
      throw new TranscriptDisabledError(videoId);
    }

    return {
      raw: rawText.trim(),
      segments
    };

  } catch (error) {
    if (error instanceof TranscriptDisabledError) {
      throw error;
    }
    
    console.error('Transcript fetch error:', error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    throw new Error(`Failed to fetch transcript: ${errorMessage}`);
  }
}