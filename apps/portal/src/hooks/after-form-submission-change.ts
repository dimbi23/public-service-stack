import type { CollectionAfterChangeHook } from "payload";
import type { Application } from "@/payload-types";

const CASE_API_URL = process.env.CASE_API_URL ?? "http://localhost:3002";

/**
 * afterChange hook on form-submissions (via formSubmissionOverrides).
 *
 * When a form submission is updated after initial creation (e.g. an admin
 * annotates it), find the linked Application and propagate its current status
 * to case-api so both systems stay in sync.
 */
export const afterFormSubmissionChange: CollectionAfterChangeHook = async ({
	doc,
	operation,
	req,
}) => {
	// Only act on updates, not creates (creates are handled by create-application)
	if (operation !== "update" || !doc?.id) {
		return doc;
	}

	// Find the Application linked to this submission
	let application: Application | null = null;
	try {
		const result = await req.payload.find({
			collection: "applications",
			where: { submission: { equals: doc.id } },
			limit: 1,
			overrideAccess: true,
		});
		application = (result.docs[0] as Application) ?? null;
	} catch {
		return doc;
	}

	if (!application?.caseId || !application.status) {
		return doc;
	}

	// Map portal Application status → case-api CaseStatus
	const STATUS_MAP: Record<string, string> = {
		pending: "submitted",
		processing: "under_review",
		approved: "approved",
		rejected: "rejected",
		info_required: "pending_documents",
	};

	const caseStatus = STATUS_MAP[application.status];
	if (!caseStatus) {
		return doc;
	}

	// Push status update to case-api (fire-and-forget, non-blocking)
	fetch(`${CASE_API_URL}/v1/cases/${application.caseId}/status`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ status: caseStatus }),
	}).catch((err) => {
		console.warn(
			`[afterFormSubmissionChange] Failed to sync status to case-api for case ${application!.caseId}: ${err instanceof Error ? err.message : String(err)}`,
		);
	});

	return doc;
};
