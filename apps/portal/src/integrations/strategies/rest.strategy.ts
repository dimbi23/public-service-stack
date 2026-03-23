import type {
	IntegrationConfig,
	IntegrationStrategy,
	SubmissionData,
} from "../types";

export class RestIntegrationStrategy implements IntegrationStrategy {
	name = "rest";

	async execute(
		data: SubmissionData,
		config: IntegrationConfig
	): Promise<void> {
		if (!config.url) {
			throw new Error("URL is required for REST integration");
		}

		const method = config.method || "POST";
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (config.headers) {
			for (const header of config.headers) {
				headers[header.key] = header.value;
			}
		}

		const payload = this.transformData(data, config.fieldMapping);

		try {
			const response = await fetch(config.url, {
				method,
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`External API error: ${response.status} ${response.statusText} - ${errorText}`
				);
			}
		} catch (error) {
			console.error("REST Integration failed:", error);
			throw error; // Re-throw to let Payload know something went wrong
		}
	}

	private transformData(
		data: SubmissionData,
		mapping?: { formField: string; apiField: string }[]
	): Record<string, unknown> {
		if (!mapping || mapping.length === 0) {
			return data;
		}

		const transformed: Record<string, unknown> = {};

		// Include mapped fields
		for (const { formField, apiField } of mapping) {
			if (Object.hasOwn(data, formField)) {
				transformed[apiField] = data[formField];
			}
		}

		// Optionally include unmapped fields or just stick to the mapping.
		// For now, let's assume if mapping exists, we ONLY send mapped fields to be strict.
		// If we want to mix, we'd copy data first.

		return transformed;
	}
}
