import type { CollectionConfig } from "payload";

export const ServiceViews: CollectionConfig = {
	slug: "service-views",
	admin: {
		useAsTitle: "id",
		defaultColumns: ["service", "viewedAt"],
		description:
			"Tracks views of service detail pages (for offline services without forms)",
	},
	access: {
		read: () => true, // Allow reading for stats
		create: () => true, // Allow public to create views
		update: () => false, // Views are immutable
		delete: () => false, // Views are immutable
	},
	fields: [
		{
			name: "service",
			type: "relationship",
			relationTo: "services",
			required: true,
			index: true,
		},
		{
			name: "viewedAt",
			type: "date",
			required: true,
			defaultValue: () => new Date().toISOString(),
			index: true,
		},
	],
};
