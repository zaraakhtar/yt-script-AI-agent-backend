import { useState, useEffect } from 'react';
import { Job } from '../types';
import { getJobStatus } from '../services/api';

// This hook polls the API to get the status of a job
export function useJobStatus(jobId: string | undefined) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;

    // Function to fetch the job status
    const fetchStatus = async () => {
      try {
        const latestJob = await getJobStatus(jobId);
        setJob(latestJob);

        // If the job is done or has an error, we stop polling
        if (latestJob.status === 'done' || latestJob.status === 'error') {
          clearInterval(intervalId);
        }
      } catch (err) {
        // Log the actual error to the console for debugging
        console.error("Failed to fetch job status:", err);
        setError('Failed to get job status. Please try again later.');
        clearInterval(intervalId);
      }
    };

    // Poll the API every 3 seconds
    const intervalId = setInterval(fetchStatus, 3000);

    // Initial fetch
    fetchStatus();

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [jobId]);

  return { job, error };
}