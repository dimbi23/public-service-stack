/**
 * BullMQ-based job queue for production-grade service imports
 * 
 * Features:
 * - Redis-backed persistence (survives restarts)
 * - Horizontal scaling (multiple workers)
 * - Retry logic with exponential backoff
 * - Job progress tracking
 * - Automatic cleanup of completed jobs
 * - Bull Board UI for monitoring
 * 
 * Environment variables:
 *   REDIS_URL          Redis connection URL (default: redis://localhost:6379)
 *   BULL_PREFIX        Queue name prefix (default: bull)
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// ── Types ───────────────────────────────────────────────────────────────────

export type JobStatus = 
  | 'pending' 
  | 'waiting' 
  | 'active' 
  | 'completed' 
  | 'failed' 
  | 'delayed';

export interface JobData {
  fileBuffer: string; // Base64 encoded
  fileName: string;
  userId?: number;
  tenantId?: number;
}

export interface JobProgress {
  completed: number;
  failed: number;
  total: number;
  errors: Array<{ row: number; message: string }>;
}

export interface JobResult {
  successful: number;
  failed: number;
  total: number;
  errors: Array<{ row: number; message: string }>;
}

export interface JobState {
  id: string;
  status: JobStatus;
  progress: number;
  total: number;
  completed: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  result?: JobResult;
  createdAt: Date;
  updatedAt: Date;
  failedReason?: string;
  attemptsMade: number;
}

// ── Redis Connection ─────────────────────────────────────────────────────────

function createRedisConnection(): IORedis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redis.on('connect', () => {
    console.log('Redis connected for BullMQ');
  });

  return redis;
}

// ── Queue Singleton ─────────────────────────────────────────────────────────

const QUEUE_NAME = 'service-imports';
const redisConnection = createRedisConnection();

// Main queue for adding jobs
export const importQueue = new Queue<JobData, JobResult, string>(QUEUE_NAME, {
  connection: redisConnection,
  prefix: process.env.BULL_PREFIX || 'bull',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, then 2s, then 4s
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // Keep completed jobs for 24 hours
      count: 100,        // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
    },
  },
});

// Queue events for real-time updates
export const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection,
});

// ── Job Status Mapper ────────────────────────────────────────────────────────

function mapBullStatusToJobStatus(bullStatus: string): JobStatus {
  const statusMap: Record<string, JobStatus> = {
    'waiting': 'waiting',
    'active': 'active',
    'completed': 'completed',
    'failed': 'failed',
    'delayed': 'delayed',
    'prioritized': 'pending',
    'paused': 'pending',
  };
  return statusMap[bullStatus] || 'pending';
}

// ── Job State Retrieval ───────────────────────────────────────────────────────

export async function getJobState(jobId: string): Promise<JobState | null> {
  const job = await importQueue.getJob(jobId);
  
  if (!job) {
    return null;
  }

  const status = await job.getState();
  const progress: JobProgress = job.progress as JobProgress || {
    completed: 0,
    failed: 0,
    total: 0,
    errors: [],
  };

  return {
    id: job.id || jobId,
    status: mapBullStatusToJobStatus(status),
    progress: progress.total > 0 
      ? Math.round((progress.completed / progress.total) * 100) 
      : 0,
    total: progress.total,
    completed: progress.completed,
    failed: progress.failed,
    errors: progress.errors || [],
    result: job.returnvalue,
    createdAt: new Date(job.timestamp),
    updatedAt: new Date(job.processedOn || job.timestamp),
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  };
}

// ── Legacy API Compatibility Layer ────────────────────────────────────────────

/**
 * @deprecated Use BullMQ directly or the new API. Maintained for backward compatibility.
 */
export class JobQueue {
  async createJob(id: string, total: number): Promise<JobState> {
    // In BullMQ, jobs are created by adding to queue
    // This method is called after the job is already added
    // So we just return the initial state
    const state = await getJobState(id);
    if (state) return state;
    
    // Fallback if job not found (shouldn't happen in normal flow)
    return {
      id,
      status: 'waiting',
      progress: 0,
      total,
      completed: 0,
      failed: 0,
      errors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      attemptsMade: 0,
    };
  }

  async getJob(id: string): Promise<JobState | undefined> {
    const state = await getJobState(id);
    return state || undefined;
  }

  async updateJob(
    id: string,
    updates: Partial<Omit<JobState, 'id' | 'createdAt'>>
  ): Promise<void> {
    const job = await importQueue.getJob(id);
    if (!job) return;

    // BullMQ doesn't allow arbitrary updates, but we can update progress
    if (updates.total !== undefined || updates.completed !== undefined) {
      const currentProgress = (job.progress as JobProgress) || {
        completed: 0,
        failed: 0,
        total: updates.total || 0,
        errors: [],
      };
      
      await job.updateProgress({
        ...currentProgress,
        total: updates.total ?? currentProgress.total,
        completed: updates.completed ?? currentProgress.completed,
        failed: updates.failed ?? currentProgress.failed,
        errors: updates.errors ?? currentProgress.errors,
      });
    }
  }

  async markProcessing(id: string): Promise<void> {
    // In BullMQ, this happens automatically when a worker picks up the job
    // No-op for compatibility
  }

  async markCompleted(id: string, result: JobResult): Promise<void> {
    const job = await importQueue.getJob(id);
    if (job) {
      await job.updateProgress({
        completed: result.successful,
        failed: result.failed,
        total: result.total,
        errors: result.errors,
      });
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    const job = await importQueue.getJob(id);
    if (job) {
      // Add error to progress for visibility
      const currentProgress = (job.progress as JobProgress) || {
        completed: 0,
        failed: 1,
        total: 1,
        errors: [{ row: 0, message: error }],
      };
      await job.updateProgress(currentProgress);
    }
  }

  async addError(id: string, row: number, message: string): Promise<void> {
    const job = await importQueue.getJob(id);
    if (!job) return;

    const currentProgress = (job.progress as JobProgress) || {
      completed: 0,
      failed: 0,
      total: 0,
      errors: [],
    };

    await job.updateProgress({
      ...currentProgress,
      failed: currentProgress.failed + 1,
      completed: currentProgress.completed + 1,
      errors: [...currentProgress.errors, { row, message }],
    });
  }

  async incrementProgress(id: string): Promise<void> {
    const job = await importQueue.getJob(id);
    if (!job) return;

    const currentProgress = (job.progress as JobProgress) || {
      completed: 0,
      failed: 0,
      total: 0,
      errors: [],
    };

    await job.updateProgress({
      ...currentProgress,
      completed: currentProgress.completed + 1,
    });
  }

  async isProcessing(id: string): Promise<boolean> {
    const state = await getJobState(id);
    return state?.status === 'active';
  }

  // No-op for BullMQ (cleanup handled by BullMQ config)
  cleanup(_maxAge?: number): void {
    // BullMQ handles cleanup via removeOnComplete/removeOnFail
  }
}

// Singleton instance for backward compatibility
export const jobQueue = new JobQueue();

// ── Worker Factory ───────────────────────────────────────────────────────────

export type JobProcessor = (job: Job<JobData>) => Promise<JobResult>;

export function createWorker(processor: JobProcessor): Worker<JobData, JobResult> {
  const worker = new Worker<JobData, JobResult>(
    QUEUE_NAME,
    async (job) => {
      console.log(`Processing job ${job.id} (attempt ${job.attemptsMade + 1})`);
      return processor(job);
    },
    {
      connection: redisConnection,
      concurrency: 3, // Process 3 jobs concurrently per worker instance
      prefix: process.env.BULL_PREFIX || 'bull',
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  return worker;
}

// ── Utility Functions ───────────────────────────────────────────────────────

export async function getQueueMetrics(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    importQueue.getWaitingCount(),
    importQueue.getActiveCount(),
    importQueue.getCompletedCount(),
    importQueue.getFailedCount(),
    importQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

export async function closeQueue(): Promise<void> {
  await importQueue.close();
  await redisConnection.quit();
}
