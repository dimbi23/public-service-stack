/**
 * Simple in-memory job queue for processing service imports
 * In production, consider using a proper queue system like BullMQ or Payload's queue plugin
 */

export interface JobStatus {
	id: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	total: number;
	completed: number;
	failed: number;
	errors: Array<{ row: number; message: string }>;
	result?: {
		successful: number;
		failed: number;
		total: number;
		errors: Array<{ row: number; message: string }>;
	};
	createdAt: Date;
	updatedAt: Date;
}

class JobQueue {
	private readonly jobs: Map<string, JobStatus> = new Map();
	private readonly processing: Set<string> = new Set();

	createJob(id: string, total: number): JobStatus {
		const job: JobStatus = {
			id,
			status: "pending",
			progress: 0,
			total,
			completed: 0,
			failed: 0,
			errors: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.jobs.set(id, job);
		return job;
	}

	getJob(id: string): JobStatus | undefined {
		return this.jobs.get(id);
	}

	updateJob(
		id: string,
		updates: Partial<Omit<JobStatus, "id" | "createdAt">>
	): void {
		const job = this.jobs.get(id);
		if (job) {
			Object.assign(job, updates, { updatedAt: new Date() });
		}
	}

	markProcessing(id: string): void {
		this.processing.add(id);
		this.updateJob(id, { status: "processing" });
	}

	markCompleted(id: string, result: JobStatus["result"]): void {
		this.processing.delete(id);
		this.updateJob(id, {
			status: "completed",
			progress: 100,
			result,
		});
	}

	markFailed(id: string, error: string): void {
		this.processing.delete(id);
		this.updateJob(id, {
			status: "failed",
			result: {
				successful: 0,
				failed: 0,
				total: 0,
				errors: [{ row: 0, message: error }],
			},
		});
	}

	addError(id: string, row: number, message: string): void {
		const job = this.jobs.get(id);
		if (job) {
			job.errors.push({ row, message });
			job.failed += 1;
			job.completed += 1;
			job.progress = Math.round((job.completed / job.total) * 100);
			this.updateJob(id, {
				errors: job.errors,
				failed: job.failed,
				completed: job.completed,
				progress: job.progress,
			});
		}
	}

	incrementProgress(id: string): void {
		const job = this.jobs.get(id);
		if (job) {
			job.completed += 1;
			job.progress = Math.round((job.completed / job.total) * 100);
			this.updateJob(id, {
				completed: job.completed,
				progress: job.progress,
			});
		}
	}

	isProcessing(id: string): boolean {
		return this.processing.has(id);
	}

	cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
		// Clean up jobs older than maxAge (default 24 hours)
		const now = Date.now();
		for (const [id, job] of this.jobs.entries()) {
			if (
				now - job.updatedAt.getTime() > maxAge &&
				(job.status === "completed" || job.status === "failed")
			) {
				this.jobs.delete(id);
			}
		}
	}
}

export const jobQueue = new JobQueue();
