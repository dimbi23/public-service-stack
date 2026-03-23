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
	[key: string]: unknown;
}

const formatSlug = (val: string): string =>
	val
		.replace(/ /g, "-")
		.replace(/[^\w-]+/g, "")
		.toLowerCase();

function getFieldSchema(
	field: NonNullable<Form["fields"]>[number]
): JSONSchema7 | null {
	// Use name as the primary identifier, fallback to blockName if somehow name is missing (though typed as required)
	const fieldName = "name" in field ? field.name : field.blockName;

	if (!fieldName) {
		return null;
	}

	const title = ("label" in field ? field.label : null) || fieldName;

	switch (field.blockType) {
		case "text":
		case "textarea":
			return { type: "string", title };
		case "email":
			return {
				type: "string",
				format: "email",
				title,
			};
		case "number":
			return { type: "number", title };
		case "checkbox":
			return { type: "boolean", title };
		case "select":
			return {
				type: "string",
				enum: (field.options || []).map((opt) => opt.value),
				title,
			};
		case "message":
			// Message fields usually don't have a value to validate, so we skip or treat as string
			return { type: "string", title };
		default:
			return null;
	}
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

	if (!formConfig.fields) {
		return schema;
	}

	for (const field of formConfig.fields) {
		const property = getFieldSchema(field);
		const fieldName = "name" in field ? field.name : field.blockName;

		if (!(property && fieldName)) {
			continue;
		}

		if ("required" in field && field.required) {
			(schema.required as string[]).push(fieldName);
		}

		if (schema.properties) {
			schema.properties[fieldName] = property;
		}
	}

	return schema;
}
