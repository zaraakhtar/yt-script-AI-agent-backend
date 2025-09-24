import { fetchTranscript } from "./transcriptService.js";

// Example: define urls array before using it
const urls: string[] = []; // TODO: populate this array with YouTube URLs

// later inside generateScript()
const transcripts = await Promise.all(urls.map(url => {
  const videoId = new URL(url).searchParams.get("v");
  if (!videoId) throw new Error(`Invalid YouTube URL: ${url}`);
  return fetchTranscript(videoId);
}));
