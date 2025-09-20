import OpenAI from 'openai';
import { ANALYZE_PROMPT, GENERATE_PROMPT } from '../prompts.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Analysis {
  structure: string[];
  hook_example: string;
  main_points: string[];
  cta: string;
}

/**
 * Analyze transcript using OpenAI to extract structure and key elements
 * Handles token limits by truncating long transcripts
 */
export async function analyzeTranscript(transcript: string): Promise<Analysis> {
  try {
    // Truncate transcript to manage token limits (approximately 3500 chars = ~875 tokens)
    const truncatedTranscript = transcript.length > 3500 
      ? transcript.substring(0, 3500) + '...'
      : transcript;

    console.log(`Analyzing transcript (${truncatedTranscript.length} chars)...`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // More cost-effective for analysis
      messages: [
        {
          role: 'system',
          content: 'You are an expert YouTube script analyst. Always return valid JSON.'
        },
        {
          role: 'user',
          content: ANALYZE_PROMPT + truncatedTranscript
        }
      ],
      temperature: 0.3,
      max_tokens: 800, // Conservative limit for JSON response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate JSON response
    let analysis: Analysis;
    try {
      analysis = JSON.parse(content.trim());
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from AI analysis');
    }

    // Validate and provide defaults
    const validatedAnalysis: Analysis = {
      structure: Array.isArray(analysis.structure) ? analysis.structure : ['Hook', 'Intro', 'Main Content', 'CTA'],
      hook_example: typeof analysis.hook_example === 'string' ? analysis.hook_example : '',
      main_points: Array.isArray(analysis.main_points) ? analysis.main_points : [],
      cta: typeof analysis.cta === 'string' ? analysis.cta : 'Subscribe for more!'
    };

    console.log(`Analysis complete: ${validatedAnalysis.structure.length} sections, ${validatedAnalysis.main_points.length} main points`);
    return validatedAnalysis;

  } catch (error) {
    console.error('AI analysis error:', error);
    if (error instanceof Error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    } else {
      throw new Error('AI analysis failed: Unknown error');
    }
  }
}

/**
 * Generate original script from blueprint using OpenAI
 */
export async function generateScriptFromBlueprint(
  blueprint: any,
  title: string,
  targetWordCount: number
): Promise<string> {
  try {
    console.log(`Generating script for "${title}" (target: ${targetWordCount} words)...`);

    const prompt = GENERATE_PROMPT
      .replace('{blueprint}', JSON.stringify(blueprint, null, 2))
      .replace('{title}', title)
      .replace('{targetWordCount}', targetWordCount.toString());

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use full GPT-4o for creative generation
      messages: [
        {
          role: 'system',
          content: 'You are a professional YouTube script writer. Write engaging, original content that follows the provided structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7, // More creative for script generation
      max_tokens: Math.min(3000, Math.ceil(targetWordCount * 1.5)), // Allow for overhead
    });

    const script = response.choices[0]?.message?.content;
    if (!script) {
      throw new Error('No script generated from OpenAI');
    }

    console.log(`Script generated (${script.length} characters)`);
    
    // Log token usage for cost monitoring
    if (response.usage) {
      console.log(`Token usage: ${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ${response.usage.total_tokens} total`);
    }

    return script.trim();

  } catch (error) {
    console.error('Script generation error:', error);
    if (error instanceof Error) {
      throw new Error(`Script generation failed: ${error.message}`);
    } else {
      throw new Error('Script generation failed: Unknown error');
    }
  }
}