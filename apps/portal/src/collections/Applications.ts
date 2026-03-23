import type { CollectionConfig } from "payload";

export const Applications: CollectionConfig = {
	slug: "applications",
	admin: {
		useAsTitle: "trackingId",
		defaultColumns: ["trackingId", "status", "applicantEmail", "createdAt"],
	},
	access: {
		read: ({ req: { user } }) => {
			// Only admins can read all applications
			// Public access is handled via the track-application endpoint
			return !!user;
		},
	},
	fields: [
		{
			name: "trackingId",
			type: "text",
			required: true,
			unique: true,
			index: true,
			admin: {
				readOnly: true,
			},
		},
		{
			name: "status",
			type: "select",
			defaultValue: "pending",
			options: [
				{ label: "Pending", value: "pending" },
				{ label: "Processing", value: "processing" },
				{ label: "Approved", value: "approved" },
				{ label: "Rejected", value: "rejected" },
				{ label: "Info Required", value: "info_required" },
			],
			required: true,
		},
		{
			name: "submission",
			type: "relationship",
			relationTo: "form-submissions",
			required: true,
			admin: {
				readOnly: true,
			},
		},
		{
			name: "service",
			type: "relationship",
			relationTo: "services",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "applicantEmail",
			type: "email",
			index: true,
		},
		{
			name: "timeline",
			type: "array",
			fields: [
				{
					name: "status",
					type: "text",
				},
				{
					name: "timestamp",
					type: "date",
				},
				{
					name: "note",
					type: "textarea",
				},
			],
		},
	],
	hooks: {
		beforeChange: [
			({ data, originalDoc, operation }) => {
				// Auto-update timeline on status change
				if (
					operation === "update" &&
					originalDoc.status !== data.status
				) {
					const timeline =
						data.timeline || originalDoc.timeline || [];
					timeline.push({
						status: data.status,
						timestamp: new Date().toISOString(),
						note: `Status changed to ${data.status}`,
					});
					data.timeline = timeline;
				}
				return data;
			},
		],
	},
};
