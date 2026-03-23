import { headers as getHeaders } from "next/headers.js";
import { getPayload } from "payload";
import { Categories } from "@/components/Categories";
import { Hero } from "@/components/Hero";
import { Popular } from "@/components/Popular";
import config from "@/payload.config";

export default async function HomePage() {
	const headers = await getHeaders();
	const payloadConfig = await config;
	const payload = await getPayload({ config: payloadConfig });
	const { user } = await payload.auth({ headers });

	// console.log('User:', user)

	const categories = await payload.find({
		collection: "categories",
		depth: 0,
	});

	// Fetch all active services
	const allServices = await payload.find({
		collection: "services",
		where: {
			status: {
				equals: "active",
			},
		},
		limit: 1000, // Fetch all active services to calculate popularity
		depth: 1, // Populate category and form relationships
	});

	// Fetch service views and applications to calculate popularity
	const [serviceViews, applications] = await Promise.all([
		payload.find({
			collection: "service-views",
			limit: 10_000, // Fetch all views to count per service
			depth: 0,
		}),
		payload.find({
			collection: "applications",
			limit: 10_000, // Fetch all applications to count submissions per service
			depth: 1, // Populate service relationship
		}),
	]);

	// Count views per service (from ServiceViews collection)
	const viewCounts = new Map<number, number>();
	serviceViews.docs.forEach((view) => {
		const serviceId =
			typeof view.service === "object" ? view.service?.id : view.service;
		if (serviceId) {
			viewCounts.set(
				Number(serviceId),
				(viewCounts.get(Number(serviceId)) || 0) + 1
			);
		}
	});

	// Count form submissions per service (via applications)

	const submissionCounts = new Map<number, number>();
	applications.docs.forEach((app) => {
		const serviceId =
			typeof app.service === "object" ? app.service?.id : app.service;
		if (serviceId) {
			submissionCounts.set(
				Number(serviceId),
				(submissionCounts.get(Number(serviceId)) || 0) + 1
			);
		}
	});

	// Calculate popularity: views (for offline) + submissions (for online)
	// Sort services by popularity (total engagement)
	const servicesWithPopularity = allServices.docs.map((service) => {
		const views = viewCounts.get(Number(service.id)) || 0;
		const submissions = submissionCounts.get(Number(service.id)) || 0;
		const popularity = views + submissions;
		return { service, popularity };
	});

	// Sort by popularity (descending), then by name for tie-breaking
	servicesWithPopularity.sort((a, b) => {
		if (b.popularity !== a.popularity) {
			return b.popularity - a.popularity;
		}
		return a.service.name.localeCompare(b.service.name);
	});

	// Extract services sorted by popularity
	const popularServicesList = servicesWithPopularity.map(
		(item) => item.service
	);

	// Fetch stats for the Hero component
	const [servicesCount, serviceViewsCount, applicationsCount] =
		await Promise.all([
			payload.count({
				collection: "services",
				where: {
					status: {
						equals: "active",
					},
				},
			}),
			// Count service views (for offline services without forms)
			payload.count({
				collection: "service-views",
			}),
			// Count applications (form submissions)
			payload.count({
				collection: "applications",
			}),
		]);

	// Calculate unique citizens (unique emails from applications)
	const uniqueEmails = new Set<string>();
	applications.docs.forEach((app) => {
		if (app.applicantEmail) {
			uniqueEmails.add(app.applicantEmail.toLowerCase().trim());
		}
	});
	const uniqueViewCount = uniqueEmails.size;

	return (
		<div className="min-h-screen">
			<Hero
				applicationSent={applicationsCount.totalDocs}
				servicesCount={servicesCount.totalDocs}
				serviceViewed={serviceViewsCount.totalDocs}
				uniqueView={uniqueViewCount}
			/>
			<Categories categories={categories.docs} />
			<Popular services={popularServicesList} />
		</div>
	);
}
