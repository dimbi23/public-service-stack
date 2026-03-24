import type { Endpoint } from "payload";
import type { Application } from "@/payload-types";

const CASE_API_URL = process.env.CASE_API_URL ?? "http://localhost:3002";

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
			const result = await req.payload.find({
				collection: "applications",
				where: { trackingId: { equals: trackingId } },
				limit: 1,
				depth: 1,
				overrideAccess: true,
			});

			if (result.totalDocs === 0) {
				return Response.json(
					{ error: "Application not found" },
					{ status: 404 }
				);
			}

			const application = result.docs[0] as Application & { caseId?: string };

			// Optional email verification
			if (email && application.applicantEmail !== email) {
				return Response.json(
					{ error: "Email does not match records" },
					{ status: 403 }
				);
			}

			// Resolve service name from populated relationship
			let serviceName: string | undefined;
			if (application.service) {
				if (
					typeof application.service === "object" &&
					"name" in application.service
				) {
					serviceName = (application.service as any).name;
				} else if (typeof application.service === "number") {
					try {
						const svc = await req.payload.findByID({
							collection: "services",
							id: application.service,
							overrideAccess: true,
						});
						serviceName = (svc as any)?.name;
					} catch {
						// best-effort
					}
				}
			}

			// Enrich with live step data from case-api when caseId is available
			let steps: unknown[] | undefined;
			let liveStatus: string | undefined;
			if (application.caseId) {
				try {
					const caseRes = await fetch(
						`${CASE_API_URL}/v1/cases/${application.caseId}`,
						{ headers: { Accept: "application/json" } }
					);
					if (caseRes.ok) {
						const caseData = await caseRes.json() as {
							status: string;
							steps?: unknown[];
						};
						liveStatus = caseData.status;
						steps = caseData.steps;
					}
				} catch {
					// case-api may be temporarily unavailable — fall back to Payload data
				}
			}

			return Response.json({
				trackingId: application.trackingId,
				caseId: application.caseId,
				// Prefer live status from case-api; fall back to Payload status
				status: liveStatus ?? application.status,
				timeline: application.timeline,
				steps,
				serviceName,
				createdAt: application.createdAt,
				updatedAt: application.updatedAt,
			});
		} catch (error) {
			console.error("Error tracking application:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Internal Server Error";
			return Response.json({ error: errorMessage }, { status: 500 });
		}
	},
};
