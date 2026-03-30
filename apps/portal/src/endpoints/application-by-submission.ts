import type { Endpoint } from "payload";
import type { Application } from "@/payload-types";

/**
 * Public endpoint to fetch application by submission ID
 * Used by form submission confirmation flow
 */
export const applicationBySubmissionEndpoint: Endpoint = {
	path: "/application-by-submission",
	method: "get",
	handler: async (req) => {
		const submissionId = req.query.submissionId as string;

		if (!submissionId) {
			return Response.json(
				{ error: "Submission ID is required" },
				{ status: 400 }
			);
		}

		try {
			// Use overrideAccess to allow public access without authentication
			const result = await req.payload.find({
				collection: "applications",
				where: {
					submission: {
						equals: submissionId,
					},
				},
				limit: 1,
				overrideAccess: true, // Bypass access control for public access
			});

			if (result.totalDocs === 0) {
				return Response.json(
					{ error: "Application not found" },
					{ status: 404 }
				);
			}

			const application = result.docs[0] as Application;

			return Response.json({
				trackingId: application.trackingId,
				caseId: application.caseId,
			});
		} catch (error) {
			console.error(
				"Error fetching application by submission ID:",
				error
			);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Internal Server Error";
			return Response.json({ error: errorMessage }, { status: 500 });
		}
	},
};
