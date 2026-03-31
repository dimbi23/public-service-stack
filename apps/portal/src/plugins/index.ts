import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import { getUserTenantIDs } from "@payloadcms/plugin-multi-tenant/utilities";
import { searchPlugin } from "@payloadcms/plugin-search";
import type { Plugin } from "payload";
import { isSuperAdmin } from "@/access/is-super-admin";
import { stepField } from "@/blocks/FormStep";
import {
	specCheckboxField,
	specEmailField,
	specMessageField,
	specNumberField,
	specSelectField,
	specTextareaField,
	specTextField,
} from "@/blocks/spec-form-fields";
import { formSchemaEndpoint } from "@/endpoints/form-schema";
import { beforeFormValidateHook } from "@/hooks/before-form-validate";
import { afterFormSubmissionChange } from "@/hooks/after-form-submission-change";
import { createApplication } from "@/hooks/create-application";
import { handleSubmission } from "@/hooks/handle-submission";
import type { Config } from "@/payload-types";

export const plugins: Plugin[] = [
	multiTenantPlugin<Config>({
		enabled: true,
		collections: {
			departments: {},
			services: {},
		},
		tenantsArrayField: {
			includeDefaultField: false,
		},
		tenantField: {
			access: {
				read: () => true,
				update: ({ req }) => {
					if (isSuperAdmin(req.user)) {
						return true;
					}
					return getUserTenantIDs(req.user).length > 0;
				},
			},
		},
		userHasAccessToAllTenants: (user) => isSuperAdmin(user),
		useTenantsListFilter: false, // Disabled to avoid tenant field query errors in relationship fields
	}),
	formBuilderPlugin({
		fields: {
			text: specTextField,
			textarea: specTextareaField,
			select: specSelectField,
			email: specEmailField,
			state: false,
			country: false,
			checkbox: specCheckboxField,
			number: specNumberField,
			message: specMessageField,
			date: false,
			payment: false,
			step: stepField,
		},
		formOverrides: {
			access: {
				read: ({ req }) => {
					// Super admins can read all forms (including when validating relationship selections)
					if (isSuperAdmin(req.user)) {
						return true;
					}
					// For non-super admins, allow reading if user exists
					// The multi-tenant plugin will handle tenant filtering through its hooks
					return Boolean(req.user);
				},
				readVersions: ({ req }) => {
					// Super admins can read all form versions
					if (isSuperAdmin(req.user)) {
						return true;
					}
					return Boolean(req.user);
				},
			},
			fields: ({ defaultFields }) => [
				...defaultFields,
				{
					name: "schema",
					type: "json",
					label: "Generated JSON Schema",
					admin: { readOnly: true },
				},
				{
					name: "version",
					type: "number",
					defaultValue: 1,
					admin: { readOnly: true },
				},
				{
					name: "externalIntegration",
					type: "group",
					label: "External API Integration",
					admin: {
						description:
							"Configure external API integration for this form submission.",
					},
					fields: [
						{
							name: "type",
							type: "select",
							options: [
								{ label: "REST API", value: "rest" },
								{ label: "Webhook", value: "webhook" },
								{ label: "Custom", value: "custom" },
							],
							label: "Integration Type",
						},
						{
							name: "url",
							type: "text",
							label: "API URL",
							admin: {
								condition: (_, siblingData) =>
									["rest", "webhook"].includes(
										siblingData?.type
									),
							},
						},
						{
							name: "method",
							type: "select",
							options: ["POST", "PUT", "PATCH"],
							defaultValue: "POST",
							label: "HTTP Method",
							admin: {
								condition: (_, siblingData) =>
									siblingData?.type === "rest",
							},
						},
						{
							name: "headers",
							type: "array",
							label: "Custom Headers",
							admin: {
								condition: (_, siblingData) =>
									["rest", "webhook"].includes(
										siblingData?.type
									),
							},
							fields: [
								{
									name: "key",
									type: "text",
									required: true,
								},
								{
									name: "value",
									type: "text",
									required: true,
								},
							],
						},
						{
							name: "fieldMapping",
							type: "array",
							label: "Field Mapping",
							admin: {
								description:
									"Map form fields to API fields. Leave empty to send all data as-is.",
								condition: (_, siblingData) =>
									siblingData?.type === "rest",
							},
							fields: [
								{
									name: "formField",
									type: "text",
									label: "Form Field Name",
									required: true,
								},
								{
									name: "apiField",
									type: "text",
									label: "API Field Name",
									required: true,
								},
							],
						},
					],
				},
			],
			hooks: {
				beforeValidate: [beforeFormValidateHook],
			},
			endpoints: [formSchemaEndpoint],
		},
		formSubmissionOverrides: {
			hooks: {
				beforeChange: [handleSubmission],
				afterChange: [createApplication, afterFormSubmissionChange],
			},
		},
	}),
	searchPlugin({
		collections: ["services"],
		beforeSync: ({ originalDoc, searchDoc }) => {
			const collection = searchDoc.doc.relationTo;

			if (collection === "services") {
				return {
					...searchDoc,
					title: originalDoc.name,
				};
			}

			return searchDoc;
		},
	}),
];
