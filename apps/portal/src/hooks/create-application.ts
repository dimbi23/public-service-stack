import type { CollectionAfterChangeHook } from "payload";
import { v4 as uuidv4 } from "uuid";
import type { FormSubmission } from "@/payload-types";

const CASE_API_URL = process.env.CASE_API_URL ?? "http://localhost:3002";
const WBB_SERVICE_URL = process.env.WBB_SERVICE_URL ?? "http://localhost:3003";

export const createApplication: CollectionAfterChangeHook = async ({
	doc,
	req,
	operation,
}) => {
	// Only process new submissions
	if (operation !== "create" || !doc?.id) {
		return doc;
	}

	const submission = doc as FormSubmission;
	const submissionId = submission.id;

	// Generate tracking ID (human-readable, shown to citizen)
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	const randomPart = uuidv4().split("-")[0].toUpperCase();
	const trackingId = `APP-${date}-${randomPart}`;

	// Extract email from submission data
	let applicantEmail: string | undefined;
	if (submission.submissionData && Array.isArray(submission.submissionData)) {
		const emailField = submission.submissionData.find(
			(f) =>
				f.field === "email" || f.field?.toLowerCase().includes("email")
		);
		applicantEmail = emailField?.value || undefined;
	}

	// Find associated service via form — need both Payload id and string serviceId
	let payloadServiceId: number | undefined;
	let serviceIdStr: string | undefined;
	const formId =
		typeof submission.form === "object"
			? submission.form.id
			: submission.form;

	if (formId) {
		try {
			const services = await req.payload.find({
				collection: "services",
				where: { form: { equals: formId } },
				limit: 1,
			});
			const svc = services.docs[0] as any;
			if (svc) {
				payloadServiceId = svc.id;
				serviceIdStr = svc.serviceId; // canonical string serviceId e.g. "MAM-001"
			}
		} catch (error) {
			console.error("Error finding service:", error);
		}
	}

	// Run asynchronously so Payload response is not blocked
	(async () => {
		await new Promise((resolve) => setTimeout(resolve, 100));

		try {
			// Verify submission exists before proceeding
			const existingSubmission = await req.payload
				.findByID({ collection: "form-submissions", id: submissionId })
				.catch(() => null);

			if (!existingSubmission) {
				await new Promise((resolve) => setTimeout(resolve, 200));
				const retry = await req.payload
					.findByID({ collection: "form-submissions", id: submissionId })
					.catch(() => null);
				if (!retry) {
					console.error(
						`Submission ${submissionId} not found after retry, aborting`
					);
					return;
				}
			}

			// ── 1. Create case in case-api ─────────────────────────────────────
			let caseId: string | undefined;
			if (serviceIdStr) {
				try {
					const caseRes = await fetch(`${CASE_API_URL}/v1/cases`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							serviceId: serviceIdStr,
							applicantId: applicantEmail ?? `submission:${submissionId}`,
							submissionId: String(submissionId),
						}),
					});
					if (caseRes.ok) {
						const caseData = await caseRes.json() as { id: string };
						caseId = caseData.id;
						console.log(
							`Case created: ${caseId} for submission ${submissionId}`
						);
					} else {
						console.error(
							`case-api responded ${caseRes.status} for submission ${submissionId}`
						);
					}
				} catch (err) {
					console.error("Error calling case-api:", err);
				}
			}

			// ── 2. Trigger workflow in wbb-service ────────────────────────────
			if (caseId && serviceIdStr) {
				try {
					const wbbRes = await fetch(
						`${WBB_SERVICE_URL}/v1/workflow/trigger`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								caseId,
								serviceId: serviceIdStr,
								applicantId: applicantEmail ?? `submission:${submissionId}`,
								submissionId: String(submissionId),
							}),
						}
					);
					if (wbbRes.ok) {
						const wbbData = await wbbRes.json() as { webhookPath: string };
						console.log(
							`Workflow triggered via webhook "${wbbData.webhookPath}" for case ${caseId}`
						);
					} else {
						// Non-fatal: workflow trigger may fail if no registration exists yet
						const body = await wbbRes.text();
						console.warn(
							`wbb-service responded ${wbbRes.status} for case ${caseId}: ${body}`
						);
					}
				} catch (err) {
					console.warn("Error calling wbb-service (non-fatal):", err);
				}
			}

			// ── 3. Create Application doc in Payload ──────────────────────────
			await req.payload.create({
				collection: "applications",
				data: {
					trackingId,
					caseId,
					status: "pending",
					submission: submissionId,
					service: payloadServiceId,
					applicantEmail,
					timeline: [
						{
							status: "pending",
							timestamp: new Date().toISOString(),
							note: "Application received",
						},
					],
				},
			});

			console.log(
				`Application created: ${trackingId} (caseId: ${caseId ?? "none"}) for submission ${submissionId}`
			);
		} catch (error) {
			console.error(
				`Error creating application for submission ${submissionId}:`,
				error
			);
			if (error instanceof Error) {
				console.error("Error message:", error.message);
			}
		}
	})();

	return doc;
};
