import type { Endpoint } from "payload";
import type { Application } from "@/payload-types";

/**
 * Webhook endpoint for external services to update application status
 * Requires webhook secret for authentication
 */
export const updateApplicationStatusEndpoint: Endpoint = {
	path: "/update-application-status",
	method: "post",
	handler: async (req) => {
		// Verify webhook secret
		const webhookSecret = process.env.WEBHOOK_SECRET;
		if (!webhookSecret) {
			return Response.json(
				{ error: "Webhook secret not configured" },
				{ status: 500 }
			);
		}

		const authHeader = req.headers.get("authorization");
		// Extract secret from "Bearer <secret>" or use the header value directly
		const providedSecret = authHeader?.startsWith("Bearer ")
			? authHeader.replace("Bearer ", "")
			: authHeader;

		if (providedSecret !== webhookSecret) {
			return Response.json(
				{ error: "Unauthorized: Invalid webhook secret" },
				{ status: 401 }
			);
		}

		// Parse request body
		// Payload endpoints receive req as PayloadRequest which extends Request
		let body: { trackingId?: string; status?: string; note?: string };
		try {
			// Parse JSON from the request body
			// req is a PayloadRequest which extends Request, so it has json() method
			if (typeof req.json === "function") {
				body = await req.json();
			} else {
				return Response.json(
					{ error: "Request body parsing not available" },
					{ status: 500 }
				);
			}
		} catch (error) {
			return Response.json(
				{ error: "Invalid JSON in request body" },
				{ status: 400 }
			);
		}

		const { trackingId, status, note } = body;

		// Validate required fields
		if (!trackingId) {
			return Response.json(
				{ error: "trackingId is required" },
				{ status: 400 }
			);
		}

		if (!status) {
			return Response.json(
				{ error: "status is required" },
				{ status: 400 }
			);
		}

		// Validate status value
		const validStatuses: Array<Application["status"]> = [
			"pending",
			"processing",
			"approved",
			"rejected",
			"info_required",
		];
		if (!validStatuses.includes(status as Application["status"])) {
			return Response.json(
				{
					error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
				},
				{ status: 400 }
			);
		}

		const applicationStatus = status as Application["status"];

		try {
			// Find the application by trackingId
			const result = await req.payload.find({
				collection: "applications",
				where: {
					trackingId: {
						equals: trackingId,
					},
				},
				limit: 1,
				overrideAccess: true, // Bypass access control for webhook
			});

			if (result.totalDocs === 0) {
				return Response.json(
					{ error: "Application not found" },
					{ status: 404 }
				);
			}

			const application = result.docs[0] as Application;

			// Prepare update data with proper types
			const updateData: {
				status: Application["status"];
				timeline?: Array<{
					status: string;
					timestamp: string;
					note?: string;
				}>;
			} = {
				status: applicationStatus,
			};

			// Add timeline entry
			// Note: The beforeChange hook will also add a timeline entry if status changes,
			// but we want to ensure we capture the custom note if provided
			const existingTimeline = application.timeline || [];
			const statusChanged = application.status !== applicationStatus;

			// If status changed, the hook will add an entry, but we'll add ours with the custom note
			// If status didn't change but we have a note, we should add an entry
			if (statusChanged || note) {
				// Create a new timeline array with proper types
				const newTimeline: Array<{
					status: string;
					timestamp: string;
					note?: string;
				}> = existingTimeline
					.filter(
						(
							entry
						): entry is {
							status: string;
							timestamp: string;
							note?: string;
						} => !!entry.status && !!entry.timestamp
					)
					.map((entry) => ({
						status: entry.status!,
						timestamp: entry.timestamp!,
						note: entry.note || undefined,
					}));

				newTimeline.push({
					status: applicationStatus,
					timestamp: new Date().toISOString(),
					note:
						note ||
						(statusChanged
							? `Status updated to ${applicationStatus}`
							: "Status update"),
				});
				updateData.timeline = newTimeline;
			}

			// Update the application
			const updatedApplication = (await req.payload.update({
				collection: "applications",
				id: application.id,
				data: updateData,
				overrideAccess: true, // Bypass access control for webhook
			})) as Application;

			return Response.json({
				success: true,
				trackingId: updatedApplication.trackingId,
				status: updatedApplication.status,
				message: "Application status updated successfully",
			});
		} catch (error) {
			console.error("Error updating application status:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Internal Server Error";
			return Response.json({ error: errorMessage }, { status: 500 });
		}
	},
};
