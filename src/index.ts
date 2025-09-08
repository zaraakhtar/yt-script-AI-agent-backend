import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Test route (you’ll hit this from Chrome or Postman)
app.post("/generate", (req, res) => {
  const { urls, title, wordCount } = req.body;

  if (!urls || urls.length === 0) {
    return res.status(400).json({ error: "Please provide at least one YouTube URL" });
  }

  res.json({
    message: "Inputs received ✅",
    urls,
    title,
    wordCount,
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
