"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JobStatus {
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
}

export function ServiceUploader() {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [jobId, setJobId] = useState<string | null>(null);
	const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			const extension = selectedFile.name.split(".").pop()?.toLowerCase();
			if (!["csv", "xlsx", "xls"].includes(extension || "")) {
				setError(
					"Invalid file type. Please upload a CSV, XLSX, or XLS file."
				);
				setFile(null);
				return;
			}
			setFile(selectedFile);
			setError(null);
		}
	};

	const handleUpload = async () => {
		if (!file) {
			setError("Please select a file first");
			return;
		}

		setUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/upload-services", {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Upload failed");
			}

			const data = await response.json();
			setJobId(data.jobId);
			setJobStatus({
				id: data.jobId,
				status: "pending",
				progress: 0,
				total: 0,
				completed: 0,
				failed: 0,
				errors: [],
			});

			// Start polling for job status
			startPolling(data.jobId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			setUploading(false);
		}
	};

	const startPolling = (id: string) => {
		// Clear any existing interval
		if (pollIntervalRef.current) {
			clearInterval(pollIntervalRef.current);
		}

		// Poll every 2 seconds
		pollIntervalRef.current = setInterval(async () => {
			try {
				const response = await fetch(
					`/api/service-import-status?jobId=${id}`,
					{
						credentials: "include",
					}
				);

				if (response.ok) {
					const status: JobStatus = await response.json();
					setJobStatus(status);

					// Stop polling if job is completed or failed
					if (
						status.status === "completed" ||
						status.status === "failed"
					) {
						if (pollIntervalRef.current) {
							clearInterval(pollIntervalRef.current);
							pollIntervalRef.current = null;
						}
						setUploading(false);
					}
				}
			} catch (err) {
				console.error("Error polling job status:", err);
			}
		}, 2000);
	};

	const handleReset = () => {
		setFile(null);
		setJobId(null);
		setJobStatus(null);
		setError(null);
		setUploading(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
		if (pollIntervalRef.current) {
			clearInterval(pollIntervalRef.current);
			pollIntervalRef.current = null;
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Upload Service Catalog</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label
							className="mb-2 block font-medium text-sm"
							htmlFor="file-upload"
						>
							Select File (CSV, XLSX, or XLS)
						</label>
						<input
							accept=".csv,.xlsx,.xls"
							className="block w-full text-gray-500 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground file:text-sm hover:file:bg-primary/90"
							disabled={uploading || !!jobId}
							id="file-upload"
							onChange={handleFileChange}
							ref={fileInputRef}
							type="file"
						/>
						{file && (
							<p className="mt-2 text-gray-600 text-sm">
								Selected: {file.name} (
								{(file.size / 1024).toFixed(2)} KB)
							</p>
						)}
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">
							{error}
						</div>
					)}

					<div className="flex gap-2">
						<Button
							disabled={!file || uploading || !!jobId}
							onClick={handleUpload}
						>
							{uploading ? "Uploading..." : "Upload & Process"}
						</Button>
						{(jobStatus?.status === "completed" ||
							jobStatus?.status === "failed") && (
							<Button onClick={handleReset} variant="outline">
								Upload Another File
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{jobStatus && (
				<Card>
					<CardHeader>
						<CardTitle>Import Status</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="mb-2 flex justify-between text-sm">
								<span>Progress</span>
								<span>
									{jobStatus.progress}% ({jobStatus.completed}{" "}
									/ {jobStatus.total})
								</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
								<div
									className="h-full bg-primary transition-all duration-300"
									style={{ width: `${jobStatus.progress}%` }}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="font-medium">Status:</span>{" "}
								<span
									className={
										jobStatus.status === "completed"
											? "text-green-600"
											: jobStatus.status === "failed"
												? "text-red-600"
												: jobStatus.status ===
														"processing"
													? "text-blue-600"
													: "text-gray-600"
									}
								>
									{jobStatus.status.toUpperCase()}
								</span>
							</div>
							{jobStatus.result && (
								<>
									<div>
										<span className="font-medium">
											Successful:
										</span>{" "}
										<span className="text-green-600">
											{jobStatus.result.successful}
										</span>
									</div>
									<div>
										<span className="font-medium">
											Failed:
										</span>{" "}
										<span className="text-red-600">
											{jobStatus.result.failed}
										</span>
									</div>
								</>
							)}
						</div>

						{jobStatus.result &&
							jobStatus.result.errors.length > 0 && (
								<div>
									<h4 className="mb-2 font-medium text-sm">
										Errors:
									</h4>
									<div className="max-h-60 space-y-1 overflow-y-auto">
										{jobStatus.result.errors.map(
											(err, idx) => (
												<div
													className="rounded bg-red-50 p-2 text-red-700 text-xs"
													key={idx}
												>
													<strong>
														Row {err.row}:
													</strong>{" "}
													{err.message}
												</div>
											)
										)}
									</div>
								</div>
							)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
