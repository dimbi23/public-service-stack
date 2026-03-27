"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Category, Service } from "@/payload-types";

const sortOptions = [
	{ value: "popularity", label: "Most Popular" },
	{ value: "duration", label: "Fastest Processing" },
	{ value: "alphabetical", label: "A-Z" },
	{ value: "rating", label: "Highest Rated" },
];

interface CatalogProps {
	services: Service[];
	initialCategory?: string;
}

const ITEMS_PER_PAGE = 12;

export function Catalog({ services, initialCategory }: Readonly<CatalogProps>) {
	const searchParams = useSearchParams();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All Categories");
	const [sortBy, setSortBy] = useState("popularity");
	const [onlineOnly, setOnlineOnly] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	// Extract unique categories from services
	const categories = useMemo(() => {
		const categorySet = new Set<string>();
		services.forEach((service) => {
			if (service.category) {
				const category =
					typeof service.category === "object"
						? service.category.name
						: null;
				if (category) {
					categorySet.add(category);
				}
			}
		});
		return ["All Categories", ...Array.from(categorySet).sort()];
	}, [services]);

	useEffect(() => {
		// Use initialCategory prop if provided, otherwise check URL param
		if (initialCategory) {
			setSelectedCategory(initialCategory);
		} else {
			const categoryParam = searchParams.get("category");
			if (categoryParam) {
				// Try to find matching category name from services
				const matchingService = services.find((service) => {
					if (
						service.category &&
						typeof service.category === "object"
					) {
						return service.category.slug === categoryParam;
					}
					return false;
				});
				if (
					matchingService &&
					typeof matchingService.category === "object"
				) {
					setSelectedCategory(matchingService.category.name);
				}
			}
		}
	}, [searchParams, initialCategory, services]);

	const filteredAndSortedServices = useMemo(() => {
		const filtered = services.filter((service) => {
			const matchesSearch = service.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase()); //||
			//service.description.toLowerCase().includes(searchQuery.toLowerCase())
			const categoryName =
				service.category && typeof service.category === "object"
					? (service.category as Category).name
					: null;
			const matchesCategory =
				selectedCategory === "All Categories" ||
				categoryName === selectedCategory;
			const matchesOnline = !onlineOnly || service.access == "online";

			return matchesSearch && matchesCategory && matchesOnline;
		});

		filtered.sort((a, b) => {
			switch (sortBy) {
				case "alphabetical":
					return a.name.localeCompare(b.name);
				case "duration": {
					const aDays = typeof a.processingTime === "object" ? (a.processingTime?.slaDays ?? Infinity) : Infinity;
					const bDays = typeof b.processingTime === "object" ? (b.processingTime?.slaDays ?? Infinity) : Infinity;
					return aDays - bDays;
				}
				//case 'rating':
				//return b.rating - a.rating
				case "popularity":
				default:
					return 0;
				/*const popularityOrder = [
                        'Most Popular',
                        'Trending',
                        'Popular',
                        'Important',
                        'Essential',
                        'Fast Track',
                        'Seasonal',
                        'Specialized',
                    ]
                    return (
                        popularityOrder.indexOf(a.popularity) -
                        popularityOrder.indexOf(b.popularity)
                    )*/
			}
		});

		return filtered;
	}, [searchQuery, selectedCategory, sortBy, onlineOnly]);

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedCategory("All Categories");
		setSortBy("popularity");
		setOnlineOnly(false);
		setCurrentPage(1); // Reset to first page when clearing filters
	};

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, selectedCategory, sortBy, onlineOnly]);

	// Calculate pagination
	const totalPages = Math.ceil(
		filteredAndSortedServices.length / ITEMS_PER_PAGE
	);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const paginatedServices = filteredAndSortedServices.slice(
		startIndex,
		endIndex
	);

	// Pagination handlers
	const goToPage = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const goToPreviousPage = () => {
		if (currentPage > 1) {
			goToPage(currentPage - 1);
		}
	};

	const goToNextPage = () => {
		if (currentPage < totalPages) {
			goToPage(currentPage + 1);
		}
	};

	// Generate page numbers to display
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			// Show all pages if total is less than max
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Show first page
			pages.push(1);

			// Calculate start and end of middle pages
			let start = Math.max(2, currentPage - 1);
			let end = Math.min(totalPages - 1, currentPage + 1);

			// Adjust if we're near the start
			if (currentPage <= 3) {
				end = Math.min(4, totalPages - 1);
			}

			// Adjust if we're near the end
			if (currentPage >= totalPages - 2) {
				start = Math.max(2, totalPages - 3);
			}

			// Add ellipsis if needed
			if (start > 2) {
				pages.push("...");
			}

			// Add middle pages
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			// Add ellipsis if needed
			if (end < totalPages - 1) {
				pages.push("...");
			}

			// Show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	};

	return (
		<section className="py-8">
			<div className="container mx-auto px-4">
				{/* Header */}
				<div className="mb-8">
					<h1 className="mb-4 font-bold text-3xl text-primary md:text-4xl">
						All Government Services
					</h1>
					<p className="max-w-2xl text-lg text-muted-foreground">
						Browse our complete catalog of {services.length}{" "}
						government services. Use filters and search to find
						exactly what you need.
					</p>
				</div>

				{/* Search and Filters */}
				<div className="mb-8">
					{/* Search Bar */}
					<div className="relative mb-4">
						<Search className="-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-muted-foreground" />
						<Input
							className="py-3 pr-4 pl-12 text-base"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search services by name or description..."
							value={searchQuery}
						/>
						{searchQuery && (
							<Button
								className="-translate-y-1/2 absolute top-1/2 right-2"
								onClick={() => setSearchQuery("")}
								size="sm"
								variant="ghost"
							>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>

					{/* Filter Controls */}
					<div className="flex flex-wrap items-center gap-4">
						<Select
							onValueChange={setSelectedCategory}
							value={selectedCategory}
						>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category} value={category}>
										{category}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select onValueChange={setSortBy} value={sortBy}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								{sortOptions.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex items-center space-x-2">
							<Checkbox
								checked={onlineOnly}
								id="online-only"
								onCheckedChange={(checked) =>
									setOnlineOnly(checked === true)
								}
							/>
							<label
								className="font-medium text-sm"
								htmlFor="online-only"
							>
								Online services only
							</label>
						</div>

						<Button
							className="ml-auto bg-transparent"
							onClick={clearFilters}
							variant="outline"
						>
							Clear Filters
						</Button>
					</div>
				</div>

				{/* Results Summary */}
				<div className="mb-6">
					<p className="text-muted-foreground">
						Showing{" "}
						{paginatedServices.length > 0 ? startIndex + 1 : 0}-
						{Math.min(endIndex, filteredAndSortedServices.length)}{" "}
						of {filteredAndSortedServices.length} services
						{searchQuery && ` for "${searchQuery}"`}
						{selectedCategory !== "All Categories" &&
							` in ${selectedCategory}`}
					</p>
				</div>

				{/* Services Grid */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{paginatedServices.map((service) => (
						<Link
							href={`/services/${service.slug}`}
							key={service.id}
						>
							<Card className="group cursor-pointer shadow-none transition-all duration-200 hover:shadow-lg">
								<CardHeader className="">
									<div className="mb-2 flex items-center justify-between">
										{service.category &&
											typeof service.category === "object" && (
												<Badge
													className="min-w-0 max-w-[200px] shrink justify-start text-xs"
													variant="secondary"
												>
													<span className="block truncate">
														{(service.category as Category).name}
													</span>
												</Badge>
										)}
									</div>
									<CardTitle className="line-clamp-2 min-h-12 text-lg">
										{service.name}
									</CardTitle>
								</CardHeader>
								<CardContent className="px-6">
									<div className="mb-4 space-y-3">
										<div className="flex items-center justify-between text-sm">
											<span className="shrink-0 text-muted-foreground">
												Processing Time:
											</span>
											<span className="ml-2 max-w-[200px] truncate text-right font-medium">
												{typeof service.processingTime === "object" ? service.processingTime?.rawText ?? "—" : service.processingTime ?? "—"}
											</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">
												Fee:
											</span>
											<span className="font-medium">
												{service.costs &&
												service.costs.length > 0
													? service.costs[
															service.costs
																.length - 1
														].cost
													: "Free"}
											</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">
												Availability:
											</span>
											<Badge
												className="text-xs"
												variant={
													service.access === "online"
														? "default"
														: "secondary"
												}
											>
												{service.access === "online"
													? "Online"
													: "In-Person"}
											</Badge>
										</div>
									</div>

									<div className="mb-8 min-h-12">
										<p className="mb-2 text-muted-foreground text-xs">
											Required Documents:
										</p>
										<div className="flex flex-wrap gap-1">
											{service.documentsRequired
												?.slice(0, 3)
												.map((req) => (
													<Badge
														className="min-w-0 max-w-[200px] shrink justify-start text-xs"
														key={req.id}
														variant="outline"
													>
														<span className="block truncate">
															{req.documentName}
														</span>
													</Badge>
												))}
											{service.documentsRequired
												?.length! > 3 && (
												<Badge
													className="shrink-0 text-xs"
													variant="outline"
												>
													+
													{service.documentsRequired
														?.length! - 3}{" "}
													more
												</Badge>
											)}
										</div>
									</div>

									<Button
										className="group w-full"
										variant="secondary"
									>
										{service.access === "online"
											? "View Details"
											: "Learn More"}
									</Button>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>

				{/* No Results */}
				{filteredAndSortedServices.length === 0 && (
					<div className="py-12 text-center">
						<div className="mx-auto max-w-md">
							<Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="mb-2 font-semibold text-lg">
								No services found
							</h3>
							<p className="mb-4 text-muted-foreground">
								Try adjusting your search terms or filters to
								find what you're looking for.
							</p>
							<Button onClick={clearFilters} variant="outline">
								Clear all filters
							</Button>
						</div>
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="mt-12 flex items-center justify-center gap-2">
						<Button
							disabled={currentPage === 1}
							onClick={goToPreviousPage}
							size="sm"
							variant="outline"
						>
							<ChevronLeft className="h-4 w-4" />
							<span className="sr-only">Previous page</span>
						</Button>

						<div className="flex items-center gap-1">
							{getPageNumbers().map((page, index) => {
								if (page === "...") {
									return (
										<span
											className="px-3 py-2 text-muted-foreground"
											key={`ellipsis-${index}`}
										>
											...
										</span>
									);
								}

								const pageNumber = page as number;
								return (
									<Button
										className={
											currentPage === pageNumber
												? "bg-accent text-accent-foreground"
												: ""
										}
										key={pageNumber}
										onClick={() => goToPage(pageNumber)}
										size="sm"
										variant={
											currentPage === pageNumber
												? "default"
												: "outline"
										}
									>
										{pageNumber}
									</Button>
								);
							})}
						</div>

						<Button
							disabled={currentPage === totalPages}
							onClick={goToNextPage}
							size="sm"
							variant="outline"
						>
							<ChevronRight className="h-4 w-4" />
							<span className="sr-only">Next page</span>
						</Button>
					</div>
				)}

				{/* Contact Support */}
				{filteredAndSortedServices.length > 0 && (
					<div className="mt-8 text-center">
						<p className="mb-4 text-muted-foreground text-sm">
							Need help finding a specific service?
						</p>
						<Button size="lg" variant="outline">
							Contact Support
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}
