import configPromise from "@payload-config";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { Related } from "@/components/Related";
import { Sheet } from "@/components/Sheet";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { lexicalToPlainText } from "@/lib/lexical-renderer";

interface ServicePageProps {
	params: Promise<{
		slug: string;
	}>;
}

export default async function ServicePage({ params }: ServicePageProps) {
	const { slug } = await params;
	const payload = await getPayload({ config: configPromise });

	const result = await payload.find({
		collection: "services",
		where: {
			slug: {
				equals: slug,
			},
		},
		limit: 1,
		depth: 2, // Populate category, department, and form relationships
	});

	const service = result.docs[0];

	if (!service) {
		notFound();
	}

	// Transform Payload data to match component expectations if necessary
	// or update components to match Payload types.
	// For now, let's map the data to match the existing component props as much as possible
	// to minimize component refactoring, or better yet, pass the whole object if we update components.

	// The Sheet component expects a specific structure. Let's map it.
	// Note: The Services collection schema might not have all fields used in the mock data.
	// We should probably update the Sheet component to handle missing data gracefully or update the schema.
	// For this task, I will map what we have and pass defaults for missing ones,
	// assuming the user will update the schema later or we update components.

	// Actually, looking at the schema, we have:
	// name, category, description, department, type, audience, access, status, eligibility, processingTime,
	// documentsRequired, costs, supportContact, steps.

	// Sheet expects:
	// title (name), description, category (relation), duration (processingTime), fee (costs?),
	// popularity (missing), rating (missing), isOnline (access?), overview (description?),
	// requirements (documentsRequired), process (steps), faqs (missing), fees (costs), offices (missing).

	const mappedService = {
		id: String(service.id),
		slug: service.slug,
		title: service.name,
		description: lexicalToPlainText(service.description),
		category:
			typeof service.category === "object"
				? service.category?.name
				: "General",
		duration: service.processingTime || "N/A",
		fee:
			service.costs && service.costs.length > 0
				? `${service.costs[0].cost} MGA`
				: "Free",
		isOnline: service.access === "online" || service.access === "hybrid",
		hasForm: !!service.form, // Whether the service has a form (online application)
		overview:
			lexicalToPlainText(service.description) || "Service details...",
		requirements:
			service.documentsRequired?.map((d) => d.documentName || "") || [],
		process:
			service.steps?.map((s, i) => ({
				step: i + 1,
				title: `Step ${i + 1}`,
				description: s.stepDescription || "",
				duration: "N/A",
			})) || [],
		fees:
			service.costs?.map((c, i) => ({
				type: `Fee ${i + 1}`,
				amount: `${c.cost} MGA`,
			})) || [],
	};

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
								<BreadcrumbLink href="/services">
									Services
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{service.name}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>

			<Sheet service={mappedService} />
			<Related
				category={
					typeof service.category === "object"
						? service.category?.name
						: "General"
				}
				currentServiceId={String(service.id)}
			/>
		</div>
	);
}
