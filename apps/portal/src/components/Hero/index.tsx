"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroProps {
	servicesCount?: number;
	serviceViewed?: number;
	applicationSent?: number;
	uniqueView?: number;
}

function formatNumber(num: number): string {
	if (num === 0) {
		return "0";
	}
	if (num >= 1_000_000) {
		return `${Math.floor(num / 1_000_000)}M+`;
	}
	if (num >= 1000) {
		return `${Math.floor(num / 1000)}K+`;
	}
	if (num >= 100) {
		return `${Math.floor(num / 100) * 100}+`;
	}
	return `${num}`;
}

export function Hero({
	servicesCount = 150,
	serviceViewed = 0,
	applicationSent = 0,
	uniqueView = 0,
}: HeroProps) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(
				`/services?search=${encodeURIComponent(searchQuery.trim())}`
			);
		}
	};

	return (
		<section className="relative text-primary-foreground">
			<div className="container mx-auto px-4 py-16 md:py-24">
				<div className="mx-auto max-w-4xl text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground md:text-6xl">
						Government Services
						<br />
						<span className="text-accent">Made Simple</span>
					</h1>
					<p className="mx-auto mb-8 max-w-2xl text-foreground/90 text-lg md:text-xl">
						Access all Madagascar government services informations
						online, apply for some documents and more - all in one
						place.
					</p>

					{/* Search Bar */}
					<form
						className="mx-auto mb-8 max-w-2xl"
						onSubmit={handleSearch}
					>
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 text-muted-foreground" />
							<Input
								className="bg-background py-8 pr-12 pl-12 text-foreground text-lg"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="What service do you need? (e.g., passport, business license)"
								value={searchQuery}
							/>
							<Button
								className="-translate-y-1/2 absolute top-1/2 right-4 bg-accent hover:bg-accent/90"
								type="submit"
							>
								<ArrowRight className="h-4 w-4" />
							</Button>
						</div>
					</form>

					{/* Quick Stats */}
					<div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 text-foreground md:grid-cols-2 lg:grid-cols-4">
						<div className="text-center">
							<div className="mb-2 font-bold text-3xl">
								{formatNumber(servicesCount)}
							</div>
							<div className="text-foreground/80 text-sm">
								Services Available
							</div>
						</div>
						<div className="text-center">
							<div className="mb-2 font-bold text-3xl">
								{formatNumber(serviceViewed)}
							</div>
							<div className="text-foreground/80 text-sm">
								Service Viewed
							</div>
						</div>
						<div className="text-center">
							<div className="mb-2 font-bold text-3xl">
								{formatNumber(applicationSent)}
							</div>
							<div className="text-foreground/80 text-sm">
								Application Sent
							</div>
						</div>
						<div className="text-center">
							<div className="mb-2 font-bold text-3xl">
								{formatNumber(uniqueView)}
							</div>
							<div className="text-foreground/80 text-sm">
								Unique View
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
