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
import type { Service } from "@/payload-types";

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
			slug: { equals: slug },
		},
		limit: 1,
		depth: 2,
	});

	const service = result.docs[0] as Service;

	if (!service) {
		notFound();
	}

	// ── Fee summary ─────────────────────────────────────────────────────────
	let feeDisplay = "Gratuit";
	if (service.fee) {
		const { model, summary, currency } = service.fee;
		if (model === "fixed" && summary?.defaultAmount != null) {
			feeDisplay = `${summary.defaultAmount.toLocaleString()} ${currency ?? "MGA"}`;
		} else if (model === "range" && summary) {
			const min = summary.minAmount;
			const max = summary.maxAmount;
			if (min != null && max != null) {
				feeDisplay = `${min.toLocaleString()} – ${max.toLocaleString()} ${currency ?? "MGA"}`;
			} else if (min != null || max != null) {
				feeDisplay = `${(min ?? max)!.toLocaleString()} ${currency ?? "MGA"}`;
			}
		} else if (model !== "unknown") {
			feeDisplay = model ?? "Voir détails";
		}
	}

	// ── Access channel ──────────────────────────────────────────────────────
	const channel = service.access?.channel ?? "unknown";
	const isOnline = channel === "online" || channel === "hybrid";

	// ── Processing time ─────────────────────────────────────────────────────
	const processingTime = service.processingTime;
	let durationDisplay = "N/A";
	if (processingTime) {
		if (processingTime.slaDays != null) {
			durationDisplay = `${processingTime.slaDays} j. ouvrables`;
		} else if (processingTime.rawText) {
			durationDisplay = processingTime.rawText;
		}
	}

	// ── Documents required ──────────────────────────────────────────────────
	const requirements: string[] =
		service.documentsRequired?.map((d: any) => d.label ?? d.documentTypeCode ?? "") ?? [];

	// ── Workflow steps ──────────────────────────────────────────────────────
	const process: { step: number; title: string; description: string; duration: string }[] =
		service.workflow?.steps?.map((s: any, i: number) => ({
			step: s.order ?? i + 1,
			title: s.label,
			description: s.stepType ?? "",
			duration: s.slaDays != null ? `${s.slaDays} j.` : "N/A",
		})) ?? [];

	// ── Fee rules ───────────────────────────────────────────────────────────
	const fees: { type: string; amount: string }[] =
		service.fee?.rules?.map((r: any, i: number) => ({
			type: r.ruleId ?? `Règle ${i + 1}`,
			amount:
				r.amount != null
					? `${r.amount.toLocaleString()} ${service.fee?.currency ?? "MGA"}`
					: r.minAmount != null && r.maxAmount != null
						? `${r.minAmount.toLocaleString()} – ${r.maxAmount.toLocaleString()} ${service.fee?.currency ?? "MGA"}`
						: "Voir détails",
		})) ?? [];

	const mappedService = {
		id: String(service.id),
		slug: service.slug,
		title: service.name,
		description: lexicalToPlainText(service.description),
		category:
			typeof service.category === "object"
				? service.category?.name
				: "Général",
		duration: durationDisplay,
		fee: feeDisplay,
		isOnline,
		hasForm: !!service.form,
		overview: lexicalToPlainText(service.description) || "Détails du service...",
		requirements,
		process,
		fees,
	};

	return (
		<div className="min-h-screen">
			<div className="bg-muted/30 py-4">
				<div className="container mx-auto px-4">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">Accueil</BreadcrumbLink>
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
						: "Général"
				}
				currentServiceId={String(service.id)}
			/>
		</div>
	);
}
