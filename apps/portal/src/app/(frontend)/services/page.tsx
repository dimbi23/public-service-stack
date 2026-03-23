import config from "@payload-config";
import { getPayload } from "payload";
import { Catalog } from "@/components/Catalog";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ServicesPageProps {
	searchParams: Promise<{
		search?: string;
		category?: string;
	}>;
}

export default async function ServicesPage({
	searchParams,
}: ServicesPageProps) {
	const params = await searchParams;
	const payloadConfig = await config;
	const payload = await getPayload({ config: payloadConfig });

	let services;
	let selectedCategoryName: string | undefined;

	// If category is provided, find the category first
	if (params.category) {
		const categories = await payload.find({
			collection: "categories",
			where: {
				slug: {
					equals: params.category,
				},
			},
			limit: 1,
			overrideAccess: true, // Ensure we can read categories even if access control changes
		});

		if (categories.docs.length > 0) {
			const category = categories.docs[0];
			selectedCategoryName = category.name;

			// Build where clause for services
			const whereClause: any = {
				category: {
					equals: category.id,
				},
			};

			// If search is also provided, use search plugin to find matching services
			if (params.search) {
				const searchResults = await payload.find({
					collection: "search",
					where: {
						title: {
							contains: params.search,
						},
					},
					limit: 1000,
					depth: 1,
				});

				const serviceIds = searchResults.docs
					.map((result) => {
						// Extract service ID from search result
						if (result.doc?.value) {
							if (
								typeof result.doc.value === "object" &&
								"id" in result.doc.value
							) {
								return result.doc.value.id;
							}
							if (typeof result.doc.value === "number") {
								return result.doc.value;
							}
						}
						return null;
					})
					.filter((id): id is number => id !== null);

				if (serviceIds.length > 0) {
					whereClause.id = {
						in: serviceIds,
					};
				} else {
					// No search results, return empty
					services = { docs: [] };
				}
			}

			// Only query if services hasn't been set to empty
			if (!services) {
				services = await payload.find({
					collection: "services",
					where: whereClause,
					limit: 1000, // Fetch all services (or a high number)
					depth: 1, // Populate category relationship
				});
			}
		} else {
			// Category not found, return empty
			services = { docs: [] };
		}
	} else if (params.search) {
		// Only search query, no category - use search plugin
		const searchResults = await payload.find({
			collection: "search",
			where: {
				title: {
					contains: params.search,
				},
			},
			limit: 1000,
			depth: 1,
		});

		// Extract service IDs from search results
		const serviceIds = searchResults.docs
			.map((result) => {
				// Extract service ID from search result
				if (result.doc?.value) {
					if (
						typeof result.doc.value === "object" &&
						"id" in result.doc.value
					) {
						return result.doc.value.id;
					}
					if (typeof result.doc.value === "number") {
						return result.doc.value;
					}
				}
				return null;
			})
			.filter((id): id is number => id !== null);

		if (serviceIds.length > 0) {
			services = await payload.find({
				collection: "services",
				where: {
					id: {
						in: serviceIds,
					},
				},
				limit: 1000, // Fetch all matching services
				depth: 1,
			});
		} else {
			services = { docs: [] };
		}
	} else {
		// No filters, get all services
		services = await payload.find({
			collection: "services",
			limit: 1000, // Fetch all services (or a high number)
			depth: 1, // Populate category relationship
		});
	}

	return (
		<div className="min-h-screen">
			<div className="bg-muted/30 py-4">
				<div className="container mx-auto px-4">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">Home</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>All Services</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>

			<Catalog
				initialCategory={selectedCategoryName}
				services={services.docs}
			/>
		</div>
	);
}
