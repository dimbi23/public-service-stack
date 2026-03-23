import type { PayloadRequest } from "payload";
import type { Tenant } from "@/payload-types";

/**
 * Resolves a tenant by name, creating it if it doesn't exist
 * @param payload - Payload instance
 * @param tenantName - Name of the tenant (ministry) to resolve
 * @param req - Optional request object (for access control)
 */
export async function resolveTenant(
	payload: any,
	tenantName: string,
	req?: PayloadRequest
): Promise<number | null> {
	if (!(tenantName && tenantName.trim())) {
		return null;
	}

	const normalizedName = tenantName.trim();

	// Try to find existing tenant by name
	const existing = await payload.find({
		collection: "tenants",
		where: {
			name: {
				equals: normalizedName,
			},
		},
		limit: 1,
		overrideAccess: true,
	});

	if (existing.docs.length > 0) {
		const tenant = existing.docs[0] as Tenant;
		return typeof tenant.id === "number" ? tenant.id : null;
	}

	// Create new tenant if it doesn't exist
	try {
		// Generate slug from name
		const slug = normalizedName
			.toLowerCase()
			.replace(/ /g, "-")
			.replace(/[^\w-]+/g, "");

		// Generate a default baseUrl from the slug
		const baseUrl = `https://${slug}.gov.mg`;

		const created = await payload.create({
			collection: "tenants",
			data: {
				name: normalizedName,
				slug,
				baseUrl,
			},
			overrideAccess: true,
		});

		return typeof created.id === "number" ? created.id : null;
	} catch (error) {
		console.error(`Error creating tenant "${normalizedName}":`, error);
		// Log the full error for debugging
		if (error instanceof Error) {
			console.error("Error details:", error.message, error.stack);
		}
		return null;
	}
}
