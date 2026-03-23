import type { PayloadRequest } from "payload";
import type { Department } from "@/payload-types";

/**
 * Resolves a department by name, creating it if it doesn't exist
 * @param payload - Payload instance
 * @param departmentName - Name of the department to resolve
 * @param tenantId - Optional tenant ID to assign the department to (required for tenant-scoped collections)
 * @param req - Optional request object (for access control)
 */
export async function resolveDepartment(
	payload: any,
	departmentName: string,
	tenantId?: number | null,
	req?: PayloadRequest
): Promise<number | null> {
	if (!(departmentName && departmentName.trim())) {
		return null;
	}

	const normalizedName = departmentName.trim();

	// Build where clause - search by name, optionally filtered by tenant
	const whereClause: any = {
		name: {
			equals: normalizedName,
		},
	};

	// If tenantId is provided, also filter by tenant
	if (tenantId) {
		whereClause.tenant = {
			equals: tenantId,
		};
	}

	// Try to find existing department by name (and tenant if provided)
	const existing = await payload.find({
		collection: "departments",
		where: whereClause,
		limit: 1,
		overrideAccess: true,
	});

	if (existing.docs.length > 0) {
		const department = existing.docs[0] as Department;
		return typeof department.id === "number" ? department.id : null;
	}

	// Create new department if it doesn't exist
	try {
		// Generate slug from name
		let slug = normalizedName
			.toLowerCase()
			.replace(/ /g, "-")
			.replace(/[^\w-]+/g, "");

		// If tenantId is provided, append it to slug to ensure uniqueness across tenants
		// But first check if slug already exists
		if (tenantId) {
			const existingSlug = await payload.find({
				collection: "departments",
				where: {
					slug: {
						equals: slug,
					},
					tenant: {
						equals: tenantId,
					},
				},
				limit: 1,
				overrideAccess: true,
			});

			// If slug exists for this tenant, append a suffix
			if (existingSlug.docs.length > 0) {
				slug = `${slug}-${Date.now()}`;
			}
		}

		const departmentData: any = {
			name: normalizedName,
			slug,
			description: `Department: ${normalizedName}`,
		};

		// Assign tenant if provided
		if (tenantId) {
			departmentData.tenant = tenantId;
		}

		const created = await payload.create({
			collection: "departments",
			data: departmentData,
			overrideAccess: true,
		});

		return typeof created.id === "number" ? created.id : null;
	} catch (error) {
		console.error(`Error creating department "${normalizedName}":`, error);
		// Log the full error for debugging
		if (error instanceof Error) {
			console.error("Error details:", error.message, error.stack);
		}
		return null;
	}
}
