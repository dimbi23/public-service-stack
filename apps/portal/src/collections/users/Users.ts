import { tenantsArrayField } from "@payloadcms/plugin-multi-tenant/fields";
import type { CollectionConfig } from "payload";
import { isSuperAdmin } from "@/access/is-super-admin";
import { createAccess } from "@/collections/users/access/create";
import { readAccess } from "@/collections/users/access/read";
import { updateAndDeleteAccess } from "@/collections/users/access/update-and-delete";

const defaultTenantArrayField = tenantsArrayField({
	tenantsArrayFieldName: "tenants",
	tenantsArrayTenantFieldName: "tenant",
	tenantsCollectionSlug: "tenants",
	arrayFieldAccess: {},
	tenantFieldAccess: {},
	rowFields: [
		{
			name: "roles",
			type: "select",
			defaultValue: ["tenant-viewer"],
			hasMany: true,
			options: ["tenant-admin", "tenant-viewer"],
			required: true,
		},
	],
});

export const Users: CollectionConfig = {
	slug: "users",
	access: {
		read: readAccess,
		create: createAccess,
		update: updateAndDeleteAccess,
		delete: updateAndDeleteAccess,
	},
	admin: {
		useAsTitle: "email",
	},
	auth: true,
	fields: [
		{
			admin: {
				position: "sidebar",
			},
			name: "roles",
			type: "select",
			defaultValue: ["agent"],
			hasMany: true,
			options: ["admin", "agent"],
			access: {
				update: ({ req }) => isSuperAdmin(req.user),
			},
		},
		{
			...defaultTenantArrayField,
			admin: {
				...(defaultTenantArrayField?.admin ?? {}),
				position: "sidebar",
			},
		},
	],
};
