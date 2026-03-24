import type { Block } from "payload";
import {
	specCheckboxField,
	specEmailField,
	specMessageField,
	specNumberField,
	specSelectField,
	specTextareaField,
	specTextField,
} from "./spec-form-fields";

export const stepField: Block = {
	slug: "form-step",
	labels: { singular: "Step", plural: "Steps" },
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
		},
		{
			name: "description",
			type: "textarea",
		},
		{
			name: "proceedLabel",
			type: "text",
			admin: {
				description:
					"Leave blank for no button (e.g. with Option Selector field or final step)",
			},
		},
		{
			name: "allowBack",
			type: "checkbox",
			label: "Allow Back",
			defaultValue: true,
			admin: {
				description:
					"If true, the form will allow the user to go back to the previous step from this step",
			},
		},
		{
			name: "fields",
			type: "blocks",
			blocks: [
				specTextField,
				specTextareaField,
				specSelectField,
				specEmailField,
				specNumberField,
				specCheckboxField,
				specMessageField,
			],
		},
	],
};
