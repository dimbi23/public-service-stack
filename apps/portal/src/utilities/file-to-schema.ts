import type { Form } from "@/payload-types";

interface JSONSchema7 {
	$schema?: string;
	$id?: string;
	title?: string;
	type?: string;
	properties?: {
		[key: string]: JSONSchema7;
	};
	required?: string[];
	enum?: string[];
	format?: string;
	// Spec extensions — preserved in the generated schema for downstream consumers
	"x-fieldId"?: string;
	"x-mapsToDocumentTypeCode"?: string;
	"x-mapsToWorkflowStepId"?: string;
	[key: string]: unknown;
}

const formatSlug = (val: string): string =>
	val
		.replace(/ /g, "-")
		.replace(/[^\w-]+/g, "")
		.toLowerCase();

function getFieldSchema(
	field: NonNullable<Form["fields"]>[number],
): JSONSchema7 | null {
	const fieldName = "name" in field ? field.name : field.blockName;
	if (!fieldName) return null;

	const title = ("label" in field ? field.label : null) || fieldName;

	let base: JSONSchema7 | null = null;

	switch (field.blockType) {
		case "text":
		case "textarea":
			base = { type: "string", title };
			break;
		case "email":
			base = { type: "string", format: "email", title };
			break;
		case "number":
			base = { type: "number", title };
			break;
		case "checkbox":
			base = { type: "boolean", title };
			break;
		case "select":
			base = {
				type: "string",
				enum: (field.options || []).map((opt) => opt.value),
				title,
			};
			break;
		case "message":
			base = { type: "string", title };
			break;
		default:
			return null;
	}

	// Attach spec mapping metadata as x- extensions (JSON Schema allows x- prefixed keys)
	if ("fieldId" in field && field.fieldId) {
		base["x-fieldId"] = field.fieldId as string;
	}
	if ("mapsToDocumentTypeCode" in field && field.mapsToDocumentTypeCode) {
		base["x-mapsToDocumentTypeCode"] = field.mapsToDocumentTypeCode as string;
	}
	if ("mapsToWorkflowStepId" in field && field.mapsToWorkflowStepId) {
		base["x-mapsToWorkflowStepId"] = field.mapsToWorkflowStepId as string;
	}

	return base;
}

export function generateSchemaFromForm(formConfig: Form) {
	const formId =
		formConfig.id ||
		(formConfig.title ? formatSlug(formConfig.title) : "unknown-form");

	const schema: JSONSchema7 = {
		$schema: "http://json-schema.org/draft-07/schema#",
		$id: `https://torolalana.gov.mg/schemas/${formId}-v1.json`,
		title: formConfig.title,
		type: "object",
		properties: {},
		required: [],
	};

	if (!formConfig.fields) return schema;

	for (const field of formConfig.fields) {
		const property = getFieldSchema(field);
		const fieldName = "name" in field ? field.name : field.blockName;

		if (!(property && fieldName)) continue;

		if ("required" in field && field.required) {
			(schema.required as string[]).push(fieldName);
		}

		if (schema.properties) {
			schema.properties[fieldName] = property;
		}
	}

	return schema;
}
