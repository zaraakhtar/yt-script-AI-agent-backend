import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { jobStore } from '../store/inMemoryJobs.js';
import { fetchTranscript } from '../services/transcriptService.js';
import { analyzeTranscript, generateScriptFromBlueprint } from '../services/aiService.js';
import { Job } from '../types/job.js'; // Add this import

export const generateRouter = Router();

// POST /api/generate - Start script generation
generateRouter.post('/generate', async (req, res) => {
  try {
    const { urls, title, targetWordCount = 600 } = req.body;

    // Validation
    if (!urls || !Array.isArray(urls) || urls.length < 1 || urls.length > 3) {
      return res.status(400).json({ 
        error: 'urls must be an array with 1-3 YouTube URLs' 
      });
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ 
        error: 'title is required and must be a string' 
      });
    }

    if (typeof targetWordCount !== 'number' || targetWordCount < 100 || targetWordCount > 2000) {
      return res.status(400).json({ 
        error: 'targetWordCount must be between 100 and 2000' 
      });
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

// Process job asynchronously
async function processJob(jobId: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  try {
    // Step 1: Fetch transcripts
    job.status = 'fetching';
    job.logs.push('Fetching transcripts from YouTube...');

    const transcripts = [];
    for (const url of job.urls) {
      job.logs.push(`Fetching transcript for: ${url}`);
      const transcript = await fetchTranscript(url);
      transcripts.push(transcript);
    }

    // Step 2: Analyze transcripts
    job.status = 'analyzing';
    job.logs.push(`Analyzing ${transcripts.length} transcript(s) with AI...`);

    const analyses = [];
    for (let i = 0; i < transcripts.length; i++) {
      job.logs.push(`Analyzing transcript ${i + 1}/${transcripts.length}...`);
      const analysis = await analyzeTranscript(transcripts[i].raw);
      analyses.push(analysis);
    }

    // Step 3: Create master blueprint
    job.logs.push('Creating master blueprint from analyses...');
    const blueprint = createMasterBlueprint(analyses);

    // Step 4: Generate script
    job.status = 'generating';
    job.logs.push('Generating original script...');

    const script = await generateScriptFromBlueprint(
      blueprint, 
      job.title, 
      job.targetWordCount
    );

    // Complete job
    job.status = 'done';
    job.result = script;
    job.logs.push('Script generation completed!');

  } catch (error) {
    job.status = 'error';
    job.error = (error instanceof Error) ? error.message : String(error);
    job.logs.push(`Error: ${(error instanceof Error) ? error.message : String(error)}`);
    console.error(`Job ${jobId} processing error:`, error);
  }
}

// Helper function to create master blueprint from analyses
function createMasterBlueprint(analyses: any[]) {
  // Combine structure elements (dedupe while preserving order)
  const allStructures = analyses.flatMap(a => a.structure || []);
  const uniqueStructure = [...new Set(allStructures)];

  // Combine main points
  const allMainPoints = analyses.flatMap(a => a.main_points || []);

  // Use first non-empty hook and CTA
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
    case 'fetching': return 25;
    case 'analyzing': return 50;
    case 'generating': return 75;
    case 'done': return 100;
    case 'error': return 0;
    default: return 0;
  }
}