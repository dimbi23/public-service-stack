import type { Endpoint } from "payload";
import { v4 as uuidv4 } from "uuid";
import { startImportServicesJob } from "@/jobs/import-services";
import { jobQueue } from "@/jobs/job-queue";

/**
 * Endpoint to upload and process service catalog files (Excel/CSV)
 */
export const uploadServicesEndpoint: Endpoint = {
	path: "/upload-services",
	method: "post",
	handler: async (req) => {
		try {
			// Check authentication
			if (!req.user) {
				return Response.json(
					{ error: "Unauthorized" },
					{ status: 401 }
				);
			}

			// Get file from form data
			if (!req.formData) {
				return Response.json({ error: "Multipart not supported" }, { status: 400 });
			}
			const formData = await req.formData();
			const file = formData.get("file") as File | null;

			if (!file) {
				return Response.json(
					{ error: "No file provided" },
					{ status: 400 }
				);
			}

			// Validate file type
			const fileName = file.name;
			const fileExtension = fileName.split(".").pop()?.toLowerCase();

			if (!["csv", "xlsx", "xls"].includes(fileExtension || "")) {
				return Response.json(
					{
						error: "Invalid file type. Supported formats: CSV, XLSX, XLS",
					},
					{ status: 400 }
				);
			}

			// Convert file to buffer
			const arrayBuffer = await file.arrayBuffer();
			const fileBuffer = Buffer.from(arrayBuffer);

			// Create job
			const jobId = uuidv4();
			jobQueue.createJob(jobId, 0); // Total will be updated after parsing

			// Start processing job asynchronously
			await startImportServicesJob(req.payload, jobId, {
				fileBuffer,
				fileName,
				userId:
					typeof req.user.id === "number" ? req.user.id : undefined,
			});

			return Response.json({
				jobId,
				message: "File uploaded and processing started",
				status: "pending",
			});
		} catch (error) {
			console.error("Error uploading services file:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Internal Server Error";
			return Response.json({ error: errorMessage }, { status: 500 });
		}
	},
};
