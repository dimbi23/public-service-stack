import type { Endpoint } from "payload";

export const formSchemaEndpoint: Endpoint = {
	path: "/:id/schema",
	method: "get",
	handler: async (req) => {
		const id = req.routeParams?.id;

		if (!id || typeof id !== "string") {
			return Response.json({ error: "Invalid form ID" }, { status: 400 });
		}

		const form = await req.payload.findByID({
			collection: "forms",
			id,
		});

		if (!form) {
			return Response.json({ error: "Form not found" }, { status: 404 });
		}

		return Response.json(form.schema);
	},
};
