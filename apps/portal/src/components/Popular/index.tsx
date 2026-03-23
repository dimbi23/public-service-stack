import { Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lexicalToPlainText } from "@/lib/lexical-renderer";
import type { Service } from "@/payload-types";

interface PopularProps {
	services: Service[];
}

export function Popular({ services }: Readonly<PopularProps>) {
	// Show the most popular services (already sorted by popularity from the server)
	// Limit to 4 services for display
	const displayServices = services.slice(0, 4);

	if (displayServices.length === 0) {
		return null;
	}

	return (
		<section className="py-16">
			<div className="container mx-auto px-4">
				<div className="mb-12 text-center">
					<h2 className="mb-4 font-bold text-3xl text-primary md:text-4xl">
						Most Requested Services
					</h2>
					<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
						Get started with these popular services that citizens
						use most frequently.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{displayServices.map((service) => {
						const categoryName =
							typeof service.category === "object" &&
							service.category
								? service.category.name
								: "General";
						const description = lexicalToPlainText(
							service.description
						);
						const hasForm = !!service.form;
						const serviceSlug = service.slug || String(service.id);
						const linkHref = hasForm
							? `/apply/${serviceSlug}`
							: `/services/${serviceSlug}`;

						return (
							<Link href={linkHref} key={service.id}>
								<Card className="group cursor-pointer shadow-none transition-all duration-200 hover:shadow-lg">
									<CardHeader className="pb-4">
										<div className="mb-2 flex items-center justify-between">
											<Badge
												className="min-w-0 max-w-[200px] shrink justify-start text-xs"
												variant="secondary"
											>
												<span className="block truncate">
													{categoryName}
												</span>
											</Badge>
										</div>
										<CardTitle className="line-clamp-1 text-lg transition-colors group-hover:text-accent">
											{service.name}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
											{description ||
												"Service description"}
										</p>
										<div className="mb-4 flex items-center justify-between">
											{service.processingTime && (
												<div className="flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
													<Clock className="h-3 w-3 shrink-0" />
													<span className="max-w-[200px] truncate">
														{service.processingTime}
													</span>
												</div>
											)}
											{service.access === "online" && (
												<Badge
													className="text-xs"
													variant="outline"
												>
													Online
												</Badge>
											)}
										</div>
										<Button
											className="w-full"
											variant={
												hasForm ? "default" : "outline"
											}
										>
											{hasForm
												? "Start Application"
												: "View Details"}
										</Button>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
}
