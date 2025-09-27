// packages/mobile-app/types/index.ts
export type JobStatus =
  | 'queued'
  | 'fetching'
  | 'analyzing'
  | 'generating'
  | 'formatting'
  | 'done'
  | 'error';

export interface Job {
  id: string; // The backend job ID
  docId?: string; // The ID from Firestore, if saved in the cloud
  status: JobStatus;
  logs: string[];
  createdAt: Date;
  urls: string[];
  title: string;
  targetWordCount: number;
  result?: string;
  error?: string;
  progress: number;
}