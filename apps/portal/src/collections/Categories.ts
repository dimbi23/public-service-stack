import type { CollectionConfig } from "payload";
import { isSuperAdminAccess } from "@/access/is-super-admin";

export const Categories: CollectionConfig = {
	slug: "categories",
	admin: {
		group: "Admin",
		useAsTitle: "name",
	},
	access: {
		read: () => true, // Public read access for categories
		create: isSuperAdminAccess,
		update: isSuperAdminAccess,
		delete: isSuperAdminAccess,
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		{
			name: "slug",
			type: "text",
			admin: {
				description: "Used for URL paths, example: /category-slug",
			},
			required: true,
		},
		{
			name: "description",
			type: "textarea",
			required: false,
		},
		{
			name: "icon",
			type: "text",
			admin: {
				description:
					'Icon name from a predefined set, e.g., "education", "health"',
			},
			required: false,
		},
		{
			name: "color",
			type: "text",
			admin: {
				description: "Color class for category cards, e.g., blue, red",
			},
			required: false,
		},
		{
			name: "services",
			type: "join",
			collection: "services",
			on: "category",
		},
	],
};
