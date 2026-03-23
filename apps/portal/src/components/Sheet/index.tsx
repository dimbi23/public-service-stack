"use client";

import {
	AlertCircle,
	ArrowRight,
	CheckCircle,
	Clock,
	CreditCard,
	Download,
	FileText,
	Phone,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServiceDetailProps {
	service: {
		id: string | number;
		slug?: string;
		title: string;
		description?: string;
		category: string;
		duration: string;
		fee: string;
		isOnline: boolean;
		hasForm?: boolean; // Whether the service has a form (online application)
		overview?: string;
		requirements: string[];
		process: Array<{
			step: number;
			title: string;
			description: string;
			duration: string;
		}>;
		fees: Array<{
			type: string;
			amount: string;
		}>;
	};
}

export function Sheet({ service }: Readonly<ServiceDetailProps>) {
	const [activeTab, setActiveTab] = useState("overview");
	const trackedServiceId = useRef<string | number | null>(null);

	// Track view for services without forms (offline services)
	useEffect(() => {
		// Only track views for services that don't have forms
		// Services with forms are tracked via form submissions
		// Reset tracking if service ID changes
		if (trackedServiceId.current !== service.id) {
			trackedServiceId.current = service.id;
		}

		// Use sessionStorage to prevent duplicate tracking across component remounts
		// This ensures we only track once per service per session
		if (!service.hasForm) {
			const storageKey = `service-view-tracked-${service.id}`;

			if (
				typeof window !== "undefined" &&
				!sessionStorage.getItem(storageKey)
			) {
				sessionStorage.setItem(storageKey, "true");

				fetch("/api/track-service-view", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						serviceId: service.id,
					}),
				}).catch((error) => {
					// Silently fail - view tracking shouldn't break the page
					console.error("Failed to track service view:", error);
					// Remove from sessionStorage on error so it can be retried
					sessionStorage.removeItem(storageKey);
				});
			}
		}
	}, [service.id, service.hasForm]);

	return (
		<section className="py-8">
			<div className="container mx-auto px-4">
				<div>
					<div className="mb-4 flex items-center gap-2">
						<Badge
							className="min-w-0 max-w-[200px] shrink justify-start"
							variant="secondary"
						>
							<span className="block truncate">
								{service.category}
							</span>
						</Badge>
						<Badge
							className="bg-accent"
							variant={service.isOnline ? "default" : "secondary"}
						>
							{service.isOnline
								? "Available Online"
								: "In-Person Only"}
						</Badge>
					</div>
					<h1 className="mb-4 font-bold text-3xl text-primary md:text-4xl">
						{service.title}
					</h1>
					{service.description && (
						<p className="mb-6 text-lg text-muted-foreground">
							{service.description}
						</p>
					)}
				</div>
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* Main Content */}
					<div className="lg:col-span-2">
						{/* Service Header */}
						<div className="mb-8">
							{/* Quick Stats */}
							<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
								<Card className="shadow-none">
									<CardContent className="p-4">
										<div className="flex items-center gap-2">
											<Clock className="h-5 w-5 shrink-0 text-accent" />
											<div className="min-w-0">
												<p className="text-muted-foreground text-sm">
													Processing Time
												</p>
												<p className="max-w-[200px] truncate font-semibold">
													{service.duration}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
								<Card className="shadow-none">
									<CardContent className="p-4">
										<div className="flex items-center gap-2">
											<CreditCard className="h-5 w-5 text-accent" />
											<div>
												<p className="text-muted-foreground text-sm">
													Service Fee
												</p>
												<p className="font-semibold">
													{service.fee}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
								<Card className="shadow-none">
									<CardContent className="p-4">
										<div className="flex items-center gap-2">
											<FileText className="h-5 w-5 text-accent" />
											<div>
												<p className="text-muted-foreground text-sm">
													Documents
												</p>
												<p className="font-semibold">
													{
														service.requirements
															.length
													}{" "}
													required
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Detailed Information Tabs */}
						<Tabs
							className="w-full shadow-none"
							onValueChange={setActiveTab}
							value={activeTab}
						>
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="overview">
									Overview
								</TabsTrigger>
								<TabsTrigger value="process">
									Process
								</TabsTrigger>
								<TabsTrigger value="requirements">
									Requirements
								</TabsTrigger>
							</TabsList>

							<TabsContent className="mt-6" value="overview">
								<Card className="shadow-none">
									<CardHeader>
										<CardTitle className="">
											Service Overview
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="mb-6 text-muted-foreground">
											{service.overview}
										</p>

										<div className="mb-6">
											<h4 className="mb-3 font-semibold">
												Fee Structure
											</h4>
											<div className="space-y-2">
												{service.fees.map((fee) => (
													<div
														className="flex items-center justify-between border-b py-2 last:border-b-0"
														key={fee.type}
													>
														<span className="text-sm">
															{fee.type}
														</span>
														<span className="font-semibold">
															{fee.amount}
														</span>
													</div>
												))}
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent className="mt-6" value="process">
								<Card className="shadow-none">
									<CardHeader>
										<CardTitle className="">
											Application Process
										</CardTitle>
										<CardDescription>
											Follow these steps to complete your
											application
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-6">
											{service.process.map((step) => (
												<div
													className="flex gap-4"
													key={step.step}
												>
													<div className="shrink-0">
														<div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground text-sm">
															{step.step}
														</div>
													</div>
													<div className="flex-1">
														<h4 className="mb-2 font-semibold">
															{step.title}
														</h4>
														<p className="mb-2 text-muted-foreground">
															{step.description}
														</p>
														<div className="flex items-center gap-1 text-accent text-sm">
															<Clock className="h-3 w-3" />
															<span>
																{step.duration}
															</span>
														</div>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent className="mt-6" value="requirements">
								<Card className="shadow-none">
									<CardHeader>
										<CardTitle className="">
											Required Documents
										</CardTitle>
										<CardDescription>
											Prepare these documents before
											starting your application
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{service.requirements.map(
												(requirement) => (
													<div
														className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
														key={requirement}
													>
														<CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
														<span className="text-sm">
															{requirement}
														</span>
													</div>
												)
											)}
										</div>

										<div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
											<div className="flex items-start gap-2">
												<AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
												<div>
													<h5 className="mb-1 font-semibold text-blue-900">
														Important Notes
													</h5>
													<ul className="space-y-1 text-blue-800 text-sm">
														<li>
															• All documents must
															be original or
															certified copies
														</li>
														<li>
															• Documents in
															foreign languages
															must be translated
															and notarized
														</li>
														<li>
															• Photos must be
															recent (taken within
															the last 6 months)
														</li>
														<li>
															• Ensure all
															information matches
															across documents
														</li>
													</ul>
												</div>
											</div>
										</div>

										<div className="mt-4">
											<Button
												className="w-full bg-transparent"
												variant="outline"
											>
												<Download className="mr-2 h-4 w-4" />
												Download Document Checklist
											</Button>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1">
						<div className="sticky top-24 space-y-6">
							{/* Application Card */}
							<Card className="shadow-none">
								<CardHeader>
									<CardTitle className="text-lg">
										Start Your Application
									</CardTitle>
									<CardDescription>
										Ready to begin? Start your application
										now
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-2">
										{service.isOnline ? (
											<Link
												href={`/apply/${service.slug || service.id}`}
											>
												<Button
													className="w-full bg-accent hover:bg-accent/90"
													size="lg"
												>
													Start Application
													<ArrowRight className="ml-2 h-4 w-4" />
												</Button>
											</Link>
										) : (
											<Button
												className="bg-transparent"
												size="lg"
												variant="outline"
											>
												Schedule Appointment
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										)}
										<Link href="/track">
											<Button
												className="w-full bg-transparent"
												size="lg"
												variant="outline"
											>
												Track Application
											</Button>
										</Link>
									</div>
								</CardContent>
							</Card>

							{/* Help Card */}
							<Card className="shadow-none">
								<CardHeader>
									<CardTitle className="text-lg">
										Need Help?
									</CardTitle>
									<CardDescription>
										Our support team is here to help you
										with your application.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-sm">
											<Phone className="h-4 w-4 text-accent" />
											<span>+261 20 22 123 45</span>
										</div>
										<div className="flex items-center gap-2 text-sm">
											<Clock className="h-4 w-4 text-accent" />
											<span>
												Mon-Fri: 8:00 AM - 5:00 PM
											</span>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
