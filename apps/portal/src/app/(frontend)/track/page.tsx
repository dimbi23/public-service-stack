"use client";

import type React from "react";
import { useState } from "react";
import type { Application } from "@/payload-types";

interface CaseStep {
	stepId: string;
	status: "pending" | "completed" | "skipped";
	outcome?: string;
	actorId?: string;
	note?: string;
	completedAt?: string;
}

interface TrackedApplication {
	trackingId: string;
	caseId?: string;
	status: string;
	timeline?: Application["timeline"];
	steps?: CaseStep[];
	serviceName?: string;
	createdAt: string;
	updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
	approved: "bg-green-100 text-green-800",
	rejected: "bg-red-100 text-red-800",
	under_review: "bg-yellow-100 text-yellow-800",
	pending: "bg-blue-100 text-blue-800",
	processing: "bg-purple-100 text-purple-800",
};

export default function TrackApplicationPage() {
	const [trackingId, setTrackingId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [application, setApplication] = useState<TrackedApplication | null>(
		null
	);

	const handleTrack = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setApplication(null);

		try {
			const res = await fetch(
				`/api/track-application?trackingId=${encodeURIComponent(trackingId)}`
			);
			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to fetch application");
			}

			setApplication(data as TrackedApplication);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const statusColorClass = application
		? STATUS_COLORS[application.status] ?? "bg-blue-100 text-blue-800"
		: "";

	return (
		<div className="mx-auto max-w-2xl px-4 py-12">
			<h1 className="mb-8 text-center font-bold text-3xl">
				Track Your Application
			</h1>

			<form className="mb-12" onSubmit={handleTrack}>
				<div className="flex gap-4">
					<input
						className="flex-1 rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
						onChange={(e) => setTrackingId(e.target.value)}
						placeholder="Enter Tracking ID (e.g., APP-20240301-A1B2C3D4)"
						required
						type="text"
						value={trackingId}
					/>
					<button
						className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
						disabled={loading}
						type="submit"
					>
						{loading ? "Tracking..." : "Track Status"}
					</button>
				</div>
				{error && <p className="mt-4 text-red-500">{error}</p>}
			</form>

			{application && (
				<div className="space-y-6">
					{/* Header card */}
					<div className="rounded-lg border bg-white p-6 shadow">
						<div className="flex items-start justify-between border-b pb-4">
							<div>
								{application.serviceName && (
									<>
										<p className="mb-1 text-gray-500 text-sm">Service</p>
										<p className="mb-3 font-semibold text-lg">
											{application.serviceName}
										</p>
									</>
								)}
								<p className="text-gray-500 text-sm">Tracking ID</p>
								<p className="font-bold font-mono text-lg">
									{application.trackingId}
								</p>
							</div>
							<div className="text-right">
								<p className="mb-1 text-gray-500 text-sm">Current Status</p>
								<span
									className={`inline-block rounded-full px-3 py-1 font-semibold text-sm capitalize ${statusColorClass}`}
								>
									{application.status.replace(/_/g, " ")}
								</span>
							</div>
						</div>

						{/* Timeline from Payload */}
						{application.timeline && application.timeline.length > 0 && (
							<div className="mt-6">
								<h3 className="mb-4 font-semibold text-xl">Timeline</h3>
								<div className="relative ml-3 space-y-8 border-gray-200 border-l-2">
									{application.timeline.map((event, index: number) => (
										<div className="relative pl-8" key={index}>
											<div className="-left-[9px] absolute top-0 h-4 w-4 rounded-full border-2 border-white bg-blue-500" />
											<div className="mb-1">
												<span className="text-gray-500 text-sm">
													{event.timestamp
														? new Date(event.timestamp).toLocaleString()
														: "Date not available"}
												</span>
											</div>
											<h4 className="font-medium text-md capitalize">
												{event.status
													? event.status.replace(/_/g, " ")
													: "Unknown status"}
											</h4>
											{event.note && (
												<p className="mt-1 text-gray-600">{event.note}</p>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Workflow steps from case-api */}
					{application.steps && application.steps.length > 0 && (
						<div className="rounded-lg border bg-white p-6 shadow">
							<h3 className="mb-4 font-semibold text-xl">Processing Steps</h3>
							<div className="space-y-3">
								{application.steps.map((step, i) => (
									<div
										key={step.stepId ?? i}
										className="flex items-start gap-4 rounded-lg bg-gray-50 p-4"
									>
										<div
											className={`mt-0.5 h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
												step.status === "completed"
													? "bg-green-500 text-white"
													: step.status === "skipped"
														? "bg-gray-300 text-gray-600"
														: "bg-blue-100 text-blue-700"
											}`}
										>
											{step.status === "completed"
												? "✓"
												: step.status === "skipped"
													? "—"
													: i + 1}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium capitalize">
												{step.stepId.replace(/_/g, " ")}
											</p>
											{step.outcome && (
												<p className="text-gray-500 text-sm capitalize">
													Outcome: {step.outcome}
												</p>
											)}
											{step.note && (
												<p className="mt-1 text-gray-600 text-sm">
													{step.note}
												</p>
											)}
											{step.completedAt && (
												<p className="mt-1 text-gray-400 text-xs">
													{new Date(step.completedAt).toLocaleString()}
												</p>
											)}
										</div>
										<span
											className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
												step.status === "completed"
													? "bg-green-100 text-green-700"
													: step.status === "skipped"
														? "bg-gray-100 text-gray-500"
														: "bg-blue-100 text-blue-700"
											}`}
										>
											{step.status}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
