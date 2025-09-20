// src/types/job.ts (Updated and Complete)

export type JobStatus = 
  | 'queued' 
  | 'fetching' 
  | 'analyzing' 
  | 'generating' 
  | 'formatting' // <-- ADD THIS LINE
  | 'done' 
  | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  logs: string[];
  createdAt: Date;
  urls: string[];
  title: string;
  targetWordCount: number;
  result?: string;
  error?: string;
}