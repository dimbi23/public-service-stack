import type { Endpoint } from "payload";
import { jobQueue } from "@/jobs/job-queue";

/**
 * Endpoint to check the status of a service import job
 */
export const serviceImportStatusEndpoint: Endpoint = {
	path: "/service-import-status",
	method: "get",
	handler: async (req) => {
		try {
			// Check authentication
			if (!req.user) {
				return Response.json(
					{ error: "Unauthorized" },
					{ status: 401 }
				);
			}

			const jobId = req.query.jobId as string;

			if (!jobId) {
				return Response.json(
					{ error: "Job ID is required" },
					{ status: 400 }
				);
			}

			const job = jobQueue.getJob(jobId);

			if (!job) {
				return Response.json(
					{ error: "Job not found" },
					{ status: 404 }
				);
			}

			return Response.json({
				id: job.id,
				status: job.status,
				progress: job.progress,
				total: job.total,
				completed: job.completed,
				failed: job.failed,
				errors: job.errors,
				result: job.result,
				createdAt: job.createdAt.toISOString(),
				updatedAt: job.updatedAt.toISOString(),
			});
		} catch (error) {
			console.error("Error getting job status:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Internal Server Error";
			return Response.json({ error: errorMessage }, { status: 500 });
		}
	},
};
