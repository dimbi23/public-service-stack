import configPromise from "@payload-config";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { FormSubmission } from "@/components/FormSubmission";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ApplyPageProps {
	params: Promise<{
		serviceSlug: string;
	}>;
}

export default async function ApplyPage({ params }: ApplyPageProps) {
	const { serviceSlug } = await params;
	const payload = await getPayload({ config: configPromise });

	const result = await payload.find({
		collection: "services",
		where: {
			slug: {
				equals: serviceSlug,
			},
		},
		limit: 1,
		depth: 1,
	});

	const service = result.docs[0];

	if (!service) {
		notFound();
	}

	// Get the form associated with this service
	const formId =
		service.form && typeof service.form === "object"
			? service.form.id
			: service.form || null;

	if (!formId) {
		return (
			<div className="container mx-auto px-4 py-12">
				<div className="mx-auto max-w-2xl text-center">
					<h1 className="mb-4 font-bold text-2xl">
						Form Not Available
					</h1>
					<p className="text-muted-foreground">
						This service does not have an associated form yet.
					</p>
				</div>
			</div>
		);
	}

	const form = await payload.findByID({
		collection: "forms",
		id: formId,
	});

	if (!form) {
		notFound();
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
								<BreadcrumbLink href="/services">
									Services
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink
									href={`/services/${serviceSlug}`}
								>
									{service.name}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Apply</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>

			<div className="container mx-auto px-4 py-12">
				<div className="mx-auto max-w-2xl">
					<h1 className="mb-2 font-bold text-3xl">{form.title}</h1>
					<p className="mb-8 text-muted-foreground">
						Application for: {service.name}
					</p>
					<FormSubmission form={form} serviceSlug={serviceSlug} />
				</div>
			</div>
		</div>
	);
}
