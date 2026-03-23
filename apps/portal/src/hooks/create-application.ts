import type { CollectionAfterChangeHook } from "payload";
import { v4 as uuidv4 } from "uuid";
import type { FormSubmission } from "@/payload-types";

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

	// Generate tracking ID
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

	// Find associated service via form
	let serviceId: number | undefined;
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
			serviceId = services.docs[0]?.id;
		} catch (error) {
			console.error("Error finding service:", error);
		}
	}

	// Create application asynchronously
	// Use a small delay to ensure the submission transaction is fully committed
	// This prevents foreign key constraint violations
	(async () => {
		await new Promise((resolve) => setTimeout(resolve, 100));

		try {
			// Verify submission exists before creating application
			let existingSubmission = await req.payload.findByID({
				collection: "form-submissions",
				id: submissionId,
			});

			if (!existingSubmission) {
				console.error(
					`Submission ${submissionId} not found, retrying...`
				);
				// Retry once after a longer delay
				await new Promise((resolve) => setTimeout(resolve, 200));

				// Verify again after retry
				existingSubmission = await req.payload.findByID({
					collection: "form-submissions",
					id: submissionId,
				});

				if (!existingSubmission) {
					console.error(
						`Submission ${submissionId} still not found after retry, aborting application creation`
					);
					return;
				}
			}

			await req.payload.create({
				collection: "applications",
				data: {
					trackingId,
					status: "pending",
					submission: submissionId,
					service: serviceId,
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
				`Application created: ${trackingId} for submission ${submissionId}`
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
