export interface Job {
  id: string;
  status: 'queued' | 'fetching' | 'analyzing' | 'generating' | 'done' | 'error';
  logs: string[];
  createdAt: Date;
  urls: string[];
  title: string;
  targetWordCount: number;
  result?: string;
  error?: string;
}