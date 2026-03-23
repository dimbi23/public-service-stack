import type { CollectionConfig } from "payload";
import { isSuperAdmin, isSuperAdminAccess } from "@/access/is-super-admin";

export const Departments: CollectionConfig = {
	slug: "departments",
	admin: {
		group: "Admin",
		useAsTitle: "name",
		defaultColumns: ["name", "updatedAt"],
	},
	access: {
		read: ({ req, id }) => {
			// Super admins can read all departments (including when validating relationship selections)
			if (isSuperAdmin(req.user)) {
				return true;
			}
			// For non-super admins, allow reading if user exists
			// The multi-tenant plugin will handle tenant filtering through its hooks
			return Boolean(req.user);
		},
		create: isSuperAdminAccess,
		update: isSuperAdminAccess,
		delete: isSuperAdminAccess,
	},
	fields: [
		{
			name: "name",
			label: "Nom du Département",
			type: "text",
			required: true,
		},
		{
			name: "slug",
			label: "Slug",
			type: "text",
			required: true,
			unique: true,
			admin: {
				description:
					"URL-friendly identifier (auto-generated from name if not provided)",
				position: "sidebar",
			},
			hooks: {
				beforeValidate: [
					({ value, data }) => {
						if (!value && data?.name) {
							return data.name
								.toLowerCase()
								.replace(/ /g, "-")
								.replace(/[^\w-]+/g, "");
						}
						return value;
					},
				],
			},
		},
		{
			name: "description",
			label: "Description",
			type: "textarea",
			required: false,
		},
		{
			name: "services",
			type: "join",
			collection: "services",
			on: "department",
		},
	],
};
