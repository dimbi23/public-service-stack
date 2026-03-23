import { fields } from "@payloadcms/plugin-form-builder";
import type { Block } from "payload";

const textField =
	typeof fields.text === "function" ? fields.text() : (fields.text as Block);
const textAreaField =
	typeof fields.textarea === "function"
		? fields.textarea()
		: (fields.textarea as Block);
const selectField =
	typeof fields.select === "function"
		? fields.select()
		: (fields.select as Block);
const emailField =
	typeof fields.email === "function"
		? fields.email()
		: (fields.email as Block);
const numberField =
	typeof fields.number === "function"
		? fields.number()
		: (fields.number as Block);
const checkboxField =
	typeof fields.checkbox === "function"
		? fields.checkbox()
		: (fields.checkbox as Block);
const messageField =
	typeof fields.message === "function"
		? fields.message()
		: (fields.message as Block);

export const stepField: Block = {
	slug: "form-step",
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
				textField,
				textAreaField,
				selectField,
				emailField,
				numberField,
				checkboxField,
				messageField,
			],
		},
	],
	labels: {
		singular: "Step",
		plural: "Steps",
	},
};
