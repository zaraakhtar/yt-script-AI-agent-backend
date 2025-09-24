import { Job } from '../types/job.js';

/**
 * Simple in-memory job store with TTL cleanup
 * For production: replace with Redis or database
 */
class InMemoryJobStore {
  private jobs = new Map<string, Job>();
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Clean up old jobs every 30 minutes
    this.cleanup = setInterval(() => {
      this.cleanupExpiredJobs();
    }, 30 * 60 * 1000);
  }

  set(jobId: string, job: Job): void {
    this.jobs.set(jobId, job);
  }

  get(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  delete(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  private cleanupExpiredJobs(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < oneHourAgo) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired jobs`);
    }
  }

  getStats() {
    const statuses = Array.from(this.jobs.values())
      .reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      total: this.jobs.size,
      statuses
    };
  }

  destroy(): void {
    if (this.cleanup) {
      clearInterval(this.cleanup);
    }
    this.jobs.clear();
  }
}

export const jobStore = new InMemoryJobStore();

// Graceful shutdown cleanup
process.on('SIGTERM', () => {
  jobStore.destroy();
});

process.on('SIGINT', () => {
  jobStore.destroy();
});