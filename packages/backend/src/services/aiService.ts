// src/services/aiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ANALYZE_PROMPT, GENERATE_PROMPT } from '../prompts.js';

// Get API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('The GEMINI_API_KEY environment variable is missing or empty.');
}

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Select the models
const analysisModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
const generationModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });


export interface Analysis {
  structure: string[];
  hook_example: string;
  main_points: string[];
  cta: string;
}

/**
 * Analyze transcript using Gemini to extract structure and key elements
 * Handles token limits by truncating long transcripts
 */
export async function analyzeTranscript(transcript: string): Promise<Analysis> {
  try {
    // Truncate transcript to manage token limits (approximately 3500 chars)
    const truncatedTranscript = transcript.length > 3500 
      ? transcript.substring(0, 3500) + '...'
      : transcript;

    console.log(`Analyzing transcript (${truncatedTranscript.length} chars) with Gemini...`);
    
    // Construct the full prompt for Gemini
    const fullPrompt = `You are an expert YouTube script analyst. Always return valid JSON. Do not include markdown formatting like \`\`\`json in your response.

    ${ANALYZE_PROMPT}
    
    Transcript:
    ${truncatedTranscript}`;

    const result = await analysisModel.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Parse and validate JSON response
    let analysis: Analysis;
    try {
      // Clean the response to ensure it's valid JSON before parsing
      const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', content);
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
    console.error('Gemini analysis error:', error);
    if (error instanceof Error) {
      throw new Error(`Gemini analysis failed: ${error.message}`);
    } else {
      throw new Error('Gemini analysis failed: Unknown error');
    }
  }
}

/**
 * Generate original script from blueprint using Gemini
 */
export async function generateScriptFromBlueprint(
  blueprint: any,
  title: string,
  targetWordCount: number
): Promise<string> {
  try {
    console.log(`Generating script for "${title}" (target: ${targetWordCount} words) with Gemini...`);

    const prompt = GENERATE_PROMPT
      .replace('{blueprint}', JSON.stringify(blueprint, null, 2))
      .replace('{title}', title)
      .replace('{targetWordCount}', targetWordCount.toString());

    const fullPrompt = `You are a professional YouTube script writer. Write engaging, original content that follows the provided structure. Do not add any introductory phrases like "Here is the script". Just return the raw script text.

    ${prompt}`;
    
    const result = await generationModel.generateContent(fullPrompt);
    const response = result.response;
    const script = response.text();

    if (!script) {
      throw new Error('No script generated from Gemini');
    }

    console.log(`Script generated (${script.length} characters)`);
    
    // Note: Gemini API response does not provide token usage in the same way as OpenAI.
    // You can monitor usage in your Google AI Studio dashboard.

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