// src/routes/generate.ts (The Complete and Final Version)

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { jobStore } from '../store/inMemoryJobs.js';
import { fetchTranscript } from '../services/transcriptService.js';
import { analyzeTranscript, generateScriptFromBlueprint } from '../services/aiService.js';
import { Job } from '../types/job.js';

// The router is defined and exported here
export const generateRouter = Router();

// POST /api/generate - Start script generation
generateRouter.post('/generate', async (req, res) => {
  try {
    const { urls, title, targetWordCount = 600 } = req.body;

    // Validation
    if (!urls || !Array.isArray(urls) || urls.length < 1 || urls.length > 3) {
      return res.status(400).json({ error: 'urls must be an array with 1-3 YouTube URLs' });
    }
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required and must be a string' });
    }
    if (typeof targetWordCount !== 'number' || targetWordCount < 100 || targetWordCount > 2000) {
      return res.status(400).json({ error: 'targetWordCount must be between 100 and 2000' });
    }

    // Create job
    const jobId = uuidv4();
    const job: Job = {
      id: jobId,
      status: 'queued',
      logs: ['Job created'],
      createdAt: new Date(),
      urls,
      title,
      targetWordCount
    };

    jobStore.set(jobId, job);

    // Start processing asynchronously
    processJob(jobId).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const failedJob = jobStore.get(jobId);
      if (failedJob) {
        failedJob.status = 'error';
        failedJob.error = error.message;
        failedJob.logs.push(`Error: ${error.message}`);
      }
    });

    res.json({ jobId });
  } catch (error) {
    console.error('Generate endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/status/:jobId - Get job status
generateRouter.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    status: job.status,
    logs: job.logs,
    result: job.result,
    error: job.error,
    progress: getProgressPercentage(job.status)
  });
});

// Process job asynchronously (Fully Updated and Robust)
async function processJob(jobId: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  try {
    // Step 1: Fetch transcripts (Resilient)
    job.status = 'fetching';
    job.logs.push('Fetching transcripts from YouTube...');
    const transcripts = [];
    let failedFetches = 0;
    for (const url of job.urls) {
      try {
        job.logs.push(`Fetching transcript for: ${url}`);
        const transcript = await fetchTranscript(url);
        transcripts.push(transcript);
      } catch (error: any) {
        failedFetches++;
        const errorMessage = error.message || 'Unknown error';
        console.error(`Failed to fetch transcript for ${url}:`, error);
        job.logs.push(`⚠️ Skipped ${url}: ${errorMessage}`);
      }
    }

    if (transcripts.length === 0) {
      throw new Error(`Could not fetch any transcripts. ${failedFetches} link(s) failed.`);
    }
    if (failedFetches > 0) {
      job.logs.push(`Proceeding with ${transcripts.length} out of ${job.urls.length} successful transcripts.`);
    }

    // Step 2: Analyze transcripts (Resilient)
    job.status = 'analyzing';
    job.logs.push(`Analyzing ${transcripts.length} transcript(s) with AI...`);

    const analyses = [];
    for (let i = 0; i < transcripts.length; i++) {
      try {
        job.logs.push(`Analyzing transcript ${i + 1}/${transcripts.length}...`);
        const transcriptData = transcripts[i];
        const analysis = await analyzeTranscript(transcriptData.raw);
        analyses.push(analysis);
      } catch (error: any) {
        console.error(`Failed to analyze transcript ${i + 1}:`, error);
        job.logs.push(`⚠️ Analysis failed for transcript ${i + 1}, skipping it.`);
      }
    }

    // Step 3: Create master blueprint (Handles empty/failed analyses)
    job.logs.push('Creating master blueprint from analyses...');
    const blueprint = createMasterBlueprint(analyses);
    if (analyses.length === 0) {
      job.logs.push('⚠️ All analyses failed. Using a default script template.');
    }

    // Step 4: Generate script (With Retry Logic)
    job.status = 'generating';
    job.logs.push('Generating original script...');

    let script = '';
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !script) {
      try {
        attempts++;
        if (attempts > 1) {
          job.logs.push(`Retrying script generation (Attempt ${attempts}/${maxAttempts})...`);
        }
        script = await generateScriptFromBlueprint(
          blueprint,
          job.title,
          job.targetWordCount
        );
      } catch (error: any) {
        console.error(`Script generation attempt ${attempts} failed:`, error);
        job.logs.push(`⚠️ Script generation attempt ${attempts} failed.`);
        if (attempts >= maxAttempts) {
          throw new Error(`AI script generation failed after ${maxAttempts} attempts.`);
        }
      }
    }

    // Step 5: Output Formatting & Cleaning (New Step)
    job.status = 'formatting';
    job.logs.push('Formatting and cleaning the final script...');
    const finalScript = formatAndCleanScript(script, job.targetWordCount);

    // Complete job
    job.status = 'done';
    job.result = finalScript;
    job.logs.push('✅ Script generation completed!');

  } catch (error: any) {
    job.status = 'error';
    job.error = error.message || String(error);
    job.logs.push(`❌ Error: ${error.message || String(error)}`);
    console.error(`Job ${jobId} processing error:`, error);
  }
}

// Helper function to create master blueprint from analyses
function createMasterBlueprint(analyses: any[]) {
  const allStructures = analyses.flatMap(a => a.structure || []);
  const uniqueStructure = [...new Set(allStructures)];
  const allMainPoints = analyses.flatMap(a => a.main_points || []);
  const hookExample = analyses.find(a => a.hook_example)?.hook_example || '';
  const cta = analyses.find(a => a.cta)?.cta || 'Subscribe for more content!';

  return {
    structure: uniqueStructure.length > 0 ? uniqueStructure : ['Hook', 'Intro', 'Main Content', 'CTA'],
    hook_example: hookExample,
    main_points: allMainPoints,
    cta: cta
  };
}

// Helper to get progress percentage
function getProgressPercentage(status: string): number {
  switch (status) {
    case 'queued': return 0;
    case 'fetching': return 20;
    case 'analyzing': return 40;
    case 'generating': return 60;
    case 'formatting': return 90;
    case 'done': return 100;
    case 'error': return 0;
    default: return 0;
  }
}

// New helper function for final script cleaning
function formatAndCleanScript(script: string, targetWordCount: number): string {
  let cleanedScript = script.trim();
  const actualWordCount = cleanedScript.split(/\s+/).length;
  console.log(`Final script word count: ${actualWordCount} (Target: ${targetWordCount})`);
  return cleanedScript;
}