// packages/mobile-app/services/api.ts
import { API_URL } from '../../src/constants/config';
import { Job } from '../../src/types';

export async function createJob(urls: string[], title: string, targetWordCount: number): Promise<{ jobId: string }> {
  try {
    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, title, targetWordCount }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create job');
    }
    return response.json();
  } catch (error) {
    console.error("API createJob error:", error);
    throw error; // Re-throw to be caught by the UI
  }
}

export async function getJobStatus(jobId: string): Promise<Job> {
  try {
    const response = await fetch(`${API_URL}/api/status/${jobId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get job status');
    }
    return response.json();
  } catch (error) {
    console.error("API getJobStatus error:", error);
    throw error;
  }
}