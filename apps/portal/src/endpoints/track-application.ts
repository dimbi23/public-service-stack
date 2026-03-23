import type { Endpoint } from "payload";
import type { Application } from "@/payload-types";

export const trackApplicationEndpoint: Endpoint = {
	path: "/track-application",
	method: "get",
	handler: async (req) => {
		const trackingId = req.query.trackingId as string;
		const email = req.query.email as string;

		if (!trackingId) {
			return Response.json(
				{ error: "Tracking ID is required" },
				{ status: 400 }
			);
		}

		try {
			// Use overrideAccess to allow public tracking without authentication
			// Populate service relationship to get service name
			const result = await req.payload.find({
				collection: "applications",
				where: {
					trackingId: {
						equals: trackingId,
					},
				},
				limit: 1,
				depth: 1, // Populate relationships (service)
				overrideAccess: true, // Bypass access control for public tracking
			});

			if (result.totalDocs === 0) {
				return Response.json(
					{ error: "Application not found" },
					{ status: 404 }
				);
			}

			const application = result.docs[0] as Application;

			// Optional: Verify email if provided for extra security
			if (email && application.applicantEmail !== email) {
				return Response.json(
					{ error: "Email does not match records" },
					{ status: 403 }
				);
			}

			// Extract service name from populated relationship
			let serviceName: string | undefined;
			if (application.service) {
				if (
					typeof application.service === "object" &&
					"name" in application.service
				) {
					serviceName = application.service.name;
				} else if (typeof application.service === "number") {
					// If service is not populated, fetch it
					try {
						const service = await req.payload.findByID({
							collection: "services",
							id: application.service,
							overrideAccess: true,
						});
						serviceName = service?.name;
					} catch (error) {
						console.error("Error fetching service:", error);
					}
				}
			}

			return Response.json({
				trackingId: application.trackingId,
				status: application.status,
				timeline: application.timeline,
				serviceName,
				createdAt: application.createdAt,
				updatedAt: application.updatedAt,
			});
		} catch (error) {
			console.error("Error tracking application:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Internal Server Error";
			return Response.json({ error: errorMessage }, { status: 500 });
		}
	},
};
