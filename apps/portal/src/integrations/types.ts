export interface IntegrationConfig {
	type: "rest" | "webhook" | "custom";
	url: string;
	method?: "POST" | "PUT" | "PATCH";
	headers?: { key: string; value: string }[];
	fieldMapping?: { formField: string; apiField: string }[];
}

export interface SubmissionData {
	[key: string]: unknown;
}

export interface IntegrationStrategy {
	name: string;
	execute(data: SubmissionData, config: IntegrationConfig): Promise<void>;
}
