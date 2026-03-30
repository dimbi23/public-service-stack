import type { Endpoint } from "payload";
import type { Application } from "@/payload-types";

/**
 * Webhook endpoint for external services to update application status
 * Requires webhook secret for authentication
 */
/**
 * @deprecated Webhook endpoint for external services to update application status.
 * This endpoint is no longer used as case-api is now the single source of truth for status.
 * Use case-api directly to update case status.
 */
export const updateApplicationStatusEndpoint: Endpoint = {
	path: "/update-application-status",
	method: "post",
	handler: async (req) => {
		return Response.json(
			{
				error: "Endpoint deprecated: Payload Application status is now read live from case-api.",
			},
			{ status: 410 }
		);
	},
};
