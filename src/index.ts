import express from "express";
import cors from "cors";
import { YoutubeTranscript } from "youtube-transcript";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { urls, title, wordCount } = req.body;

  if (!urls || urls.length === 0) {
    return res.status(400).json({ error: "Please provide at least one YouTube URL" });
  }

  try {
    // Fetch transcript of the first YouTube video
    const transcript = await YoutubeTranscript.fetchTranscript(urls[0]);

    res.json({
      message: "Transcript fetched ✅",
      transcript, // raw transcript data
      title,
      wordCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
