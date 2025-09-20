export const ANALYZE_PROMPT = `
Analyze the following YouTube transcript and extract key information into a JSON format.

Focus on identifying the components of the "Ultimate Faceless YouTube Scriptwriting Formula":

1.  **Hook (0-15s):** How does the video start? (e.g., shocking fact, bold promise, question).
2.  **Introduction (15-30s):** How does it relate to the viewer's pain/desire and tease the content?
3.  **Value Delivery (Main Content):** List the 3-5 main teaching points or sections.
4.  **Storytelling/Engagement:** Note any use of mini-stories, relatable lines, or direct questions.
5.  **CTA:** What is the Call to Action at the end?
6.  **Tone:** (e.g., Formal, Casual, Energetic, Authoritative).

Return the analysis in this exact JSON structure:
{
  "structure": ["Hook", "Intro", "Point 1: ...", "Point 2: ...", "Story/Example", "CTA"],
  "hook_example": "The exact opening line...",
  "main_points": ["Point 1 summary", "Point 2 summary"],
  "cta": "The exact CTA used",
  "tone": "Detected tone"
}

Transcript:
`;

export const GENERATE_PROMPT = `
You are an expert scriptwriter. Create a unique, original YouTube script based on the following blueprint and title.

**CRITICAL: You MUST strictly follow the "Ultimate Faceless YouTube Scriptwriting Formula":**

1.  **[Hook (0-15s)]: Start with a shocking fact, bold promise, or strong question.**
2.  **[Introduction (15-30s)]: Relate to the viewer's problem and state what they will learn.**
3.  **[Value Delivery - Main Content]:** Use the main points from the blueprint. For each point:
    *   Give a hooky sub-headline.
    *   Provide an explanation or example.
    *   Tease the next point.
4.  **[Storytelling & Engagement]:** Include at least one short relatable anecdote or "Imagine if..." scenario.
5.  **[Closing/CTA (15-30s)]: Summarize key points and give a clear Call to Action.**

**Title:** {title}
**Target Word Count:** {targetWordCount}

**Blueprint (Structure and Points to Cover):**
{blueprint}

---
**Instructions:**
- Write in a conversational, engaging tone.
- Use clear section headers (e.g., "[Hook]", "[Introduction]").
- Ensure the final script is close to the target word count.

**Deliver the script now:**
`;