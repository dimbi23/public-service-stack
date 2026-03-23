import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// Mock related services data
const relatedServicesData = {
	"Identity & Documents": [
		{
			id: "3",
			slug: "drivers-license",
			title: "Driver's License",
			description: "Apply for or renew your driver's license online",
			duration: "2-3 days",
			fee: "25,000 MGA",
			rating: 4.5,
			isOnline: true,
		},
		{
			id: "4",
			slug: "birth-certificate",
			title: "Birth Certificate",
			description: "Request official birth certificate copies",
			duration: "1-2 days",
			fee: "5,000 MGA",
			rating: 4.9,
			isOnline: true,
		},
		{
			id: "5",
			slug: "marriage-certificate",
			title: "Marriage Certificate",
			description: "Apply for marriage certificate and registration",
			duration: "3-4 days",
			fee: "15,000 MGA",
			rating: 4.7,
			isOnline: true,
		},
	],
	"Business Services": [
		{
			id: "1",
			slug: "passport-application",
			title: "Passport Application",
			description: "Apply for a new passport or renew your existing one",
			duration: "5-7 days",
			fee: "50,000 MGA",
			rating: 4.8,
			isOnline: true,
		},
		{
			id: "6",
			slug: "tax-payment",
			title: "Tax Payment",
			description: "Pay your annual taxes and get receipts instantly",
			duration: "Instant",
			fee: "Variable",
			rating: 4.3,
			isOnline: true,
		},
		{
			id: "10",
			slug: "work-permit",
			title: "Work Permit",
			description: "Apply for work permit for foreign nationals",
			duration: "10-14 days",
			fee: "150,000 MGA",
			rating: 4.0,
			isOnline: true,
		},
	],
};

interface RelatedServicesProps {
	currentServiceId: string;
	category: string;
}

export function Related({
	currentServiceId,
	category,
}: Readonly<RelatedServicesProps>) {
	const categoryServices =
		relatedServicesData[category as keyof typeof relatedServicesData] || [];
	const filteredServices = categoryServices.filter(
		(service) => service.id !== currentServiceId
	);

	if (filteredServices.length === 0) {
		// Fallback to show something if no specific category match, or just return null
		return null;
	}

	return (
		<section className="bg-muted/30 py-12">
			<div className="container mx-auto px-4">
				<div className="mb-8">
					<h2 className="mb-4 font-bold text-2xl text-primary md:text-3xl">
						Related Services
					</h2>
					<p className="text-muted-foreground">
						Other services in the {category} category that might
						interest you
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredServices.slice(0, 3).map((service) => (
						<Card
							className="group shadow-none transition-all duration-200 hover:shadow-lg"
							key={service.id}
						>
							<CardHeader className="pb-4">
								<div className="mb-2 flex items-center justify-between">
									<Badge
										className="min-w-0 max-w-[200px] shrink justify-start text-xs"
										variant="secondary"
									>
										<span className="block truncate">
											{category}
										</span>
									</Badge>
									<div className="flex items-center gap-1">
										<Star className="h-3 w-3 fill-current text-yellow-500" />
										<span className="text-muted-foreground text-xs">
											{service.rating}
										</span>
									</div>
								</div>
								<CardTitle className="text-lg transition-colors group-hover:text-accent">
									{service.title}
								</CardTitle>
								<CardDescription className="text-sm">
									{service.description}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="mb-4 space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Processing:
										</span>
										<span className="font-medium">
											{service.duration}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Fee:
										</span>
										<span className="font-medium">
											{service.fee}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Availability:
										</span>
										<Badge
											className="text-xs"
											variant={
												service.isOnline
													? "default"
													: "secondary"
											}
										>
											{service.isOnline
												? "Online"
												: "In-Person"}
										</Badge>
									</div>
								</div>

								<Link href={`/services/${service.slug}`}>
									<Button className="group w-full bg-accent hover:bg-accent/90">
										View Details
										<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
									</Button>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="mt-8 text-center">
					<Link
						href={`/services?category=${encodeURIComponent(category)}`}
					>
						<Button size="lg" variant="outline">
							View All {category} Services
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</div>
			</div>
		</section>
	);
}
