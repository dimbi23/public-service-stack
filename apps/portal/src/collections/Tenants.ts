import type { CollectionConfig } from "payload";
import { isSuperAdminAccess } from "@/access/is-super-admin";

export const Tenants: CollectionConfig = {
	slug: "tenants",
	access: {
		read: ({ req }) => Boolean(req.user),
		create: isSuperAdminAccess,
	},
	admin: {
		useAsTitle: "name",
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		{
			name: "baseUrl",
			type: "text",
			required: true,
			admin: {
				description: "e.g., https://mfa.gov.mg",
			},
		},
		{
			name: "description",
			type: "richText",
		},
		{
			name: "auth",
			type: "group",
			admin: {
				position: "sidebar",
			},
			fields: [
				{
					name: "tokenURL",
					type: "text",
					label: "Token URL",
					admin: {
						description: "The URL to generate the token",
					},
				},
				{ name: "clientId", type: "text" },
				{ name: "clientSecret", type: "text" },
				{ name: "scope", type: "text" },
			],
		},
		{
			name: "retries",
			type: "group",
			admin: {
				position: "sidebar",
			},
			fields: [
				{
					name: "max",
					type: "number",
					defaultValue: 5,
					admin: {
						position: "sidebar",
					},
				},
				{
					name: "timeout",
					type: "number",
					defaultValue: 8000,
					admin: {
						position: "sidebar",
					},
				},
			],
		},
	],
};
