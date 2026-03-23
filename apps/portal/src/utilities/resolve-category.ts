import type { PayloadRequest } from "payload";
import type { Category } from "@/payload-types";

/**
 * Resolves a category by name, creating it if it doesn't exist
 */
export async function resolveCategory(
	payload: any,
	categoryName: string,
	req?: PayloadRequest
): Promise<number | null> {
	if (!(categoryName && categoryName.trim())) {
		return null;
	}

	const normalizedName = categoryName.trim();

	// Try to find existing category by name
	const existing = await payload.find({
		collection: "categories",
		where: {
			name: {
				equals: normalizedName,
			},
		},
		limit: 1,
		overrideAccess: true,
	});

	if (existing.docs.length > 0) {
		const category = existing.docs[0] as Category;
		return typeof category.id === "number" ? category.id : null;
	}

	// Create new category if it doesn't exist
	try {
		// Generate slug from name
		const slug = normalizedName
			.toLowerCase()
			.replace(/ /g, "-")
			.replace(/[^\w-]+/g, "");

		const created = await payload.create({
			collection: "categories",
			data: {
				name: normalizedName,
				slug,
				description: `Category for ${normalizedName}`,
			},
			overrideAccess: true,
		});

		return typeof created.id === "number" ? created.id : null;
	} catch (error) {
		console.error(`Error creating category "${normalizedName}":`, error);
		return null;
	}
}
