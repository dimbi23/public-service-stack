import type { CollectionBeforeChangeHook } from "payload";
import type { Form } from "@/payload-types";

import { IntegrationManager } from "../integrations/manager";
import type { IntegrationConfig } from "../integrations/types";

export const handleSubmission: CollectionBeforeChangeHook = async ({
	data,
	req,
	operation,
}) => {
	if (operation === "create") {
		try {
			// Fetch the form definition to get the integration config
			// The submission data usually contains a 'form' field which is the ID of the form
			const formId = data.form;

			if (formId) {
				const form = (await req.payload.findByID({
					collection: "forms",
					id: formId,
				})) as Form;

				if (form && form.externalIntegration) {
					const config =
						form.externalIntegration as IntegrationConfig;

					// Only proceed if integration is enabled/configured
					if (config?.type) {
						const manager = IntegrationManager.getInstance();
						// We pass the submission data (which contains field values)
						// The structure of submission data depends on how form builder saves it.
						// Usually it's in 'submissionData' array or similar, but let's assume 'data' holds the raw values for now
						// or we might need to parse 'data.submissionData' if that's how Payload stores it.
						// Checking Payload Form Builder docs: it saves fields as top-level keys in the submission collection usually,
						// OR it uses a specific structure.
						// Let's pass the whole 'data' object and let the strategy/mapper handle it.

						try {
							await manager.execute(data, config);
						} catch (integrationError) {
							// Log the error but don't block the submission
							// The form submission will still be saved in Payload
							console.error(
								"External API integration failed:",
								integrationError instanceof Error
									? integrationError.message
									: String(integrationError)
							);
							// Store error in submission metadata for admin review
							// This allows admins to see which submissions had integration issues
							if (!data.metadata) {
								data.metadata = {};
							}
							data.metadata.integrationError = {
								message:
									integrationError instanceof Error
										? integrationError.message
										: "Unknown error",
								timestamp: new Date().toISOString(),
							};
						}
					}
				}
			}
		} catch (error) {
			console.error("Error in handleSubmission hook:", error);
			// Log the error but allow submission to proceed
			// This ensures users can still submit forms even if there's a system error
		}
	}

	return data;
};
