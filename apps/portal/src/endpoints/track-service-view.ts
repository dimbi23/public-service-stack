import type { Endpoint } from "payload";

export const trackServiceViewEndpoint: Endpoint = {
	path: "/track-service-view",
	method: "post",
	handler: async (req) => {
		let body: { serviceId?: number | string };
		try {
			if (typeof req.json === "function") {
				body = await req.json();
			} else {
				return Response.json(
					{ error: "Request body parsing not available" },
					{ status: 500 }
				);
			}
		} catch (error) {
			return Response.json(
				{ error: "Invalid JSON in request body" },
				{ status: 400 }
			);
		}

		const { serviceId } = body;

		if (!serviceId) {
			return Response.json(
				{ error: "Service ID is required" },
				{ status: 400 }
			);
		}

		try {
			// Verify the service exists and doesn't have a form (offline service)
			const service = await req.payload.findByID({
				collection: "services",
				id: Number(serviceId),
				overrideAccess: true,
			});

			if (!service) {
				return Response.json(
					{ error: "Service not found" },
					{ status: 404 }
				);
			}

			// Only track views for services without forms (offline services)
			// Services with forms should be tracked via form submissions
			if (service.form) {
				return Response.json(
					{
						message:
							"Service has a form, views should be tracked via form submissions",
					},
					{ status: 200 }
				);
			}

			// Create a view record
			await req.payload.create({
				collection: "service-views",
				data: {
					service: Number(serviceId),
					viewedAt: new Date().toISOString(),
				},
				overrideAccess: true,
			});

			return Response.json({ success: true });
		} catch (error) {
			console.error("Error tracking service view:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Internal Server Error";
			return Response.json({ error: errorMessage }, { status: 500 });
		}
	},
};
