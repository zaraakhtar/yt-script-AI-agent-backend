import { Innertube } from 'youtubei.js';

const run = async () => {
  try {
    const yt = await Innertube.create();
    const videoId = 'zBnZVCbOH90';

    const info = await yt.getInfo(videoId);

    if (!info.captions || !info.captions.caption_tracks.length) {
      console.log('❌ No captions available for this video.');
      return;
    }

    console.log(
      '✅ Captions found:',
      info.captions.caption_tracks.map(c => ({
        name: c.name?.simpletext || 'Unnamed',
        lang: c.language_code
      }))
    );

    // Pick English if available, otherwise the first track
    const track =
      info.captions.caption_tracks.find(c => c.language_code === 'en') ||
      info.captions.caption_tracks[0];

    // Fetch captions XML/TTML
    const res = await fetch(track.base_url);
    const xml = await res.text();

    console.log('✅ Captions raw XML fetched');
    console.log(xml.substring(0, 500)); // preview first 500 chars
  } catch (error) {
    console.error('Error:', error);
  }
};

run();
