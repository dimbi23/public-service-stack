import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";
import ServiceCategoryCard from "@/components/Categories/components/ServiceCategorycard";
import { Button } from "@/components/ui/button";
import type { Category } from "@/payload-types";

interface CategoriesProps {
	categories: Category[];
}

export const Categories: FC<CategoriesProps> = ({ categories }) => (
	<section className="bg-muted/30 py-16">
		<div className="container mx-auto px-4">
			<div className="mb-12 text-center">
				<h2 className="mb-4 font-bold text-3xl text-primary md:text-4xl">
					Browse Services by Category
				</h2>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
					Find the government service you need quickly and easily. All
					services informations are available online with step-by-step
					guidance.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{categories.map((category) => (
					<Link
						href={`/services?category=${category.slug}`}
						key={category.name}
					>
						<ServiceCategoryCard category={category} />
					</Link>
				))}
			</div>

			<div className="mt-12 text-center">
				<Link href="/services">
					<Button className="bg-accent hover:bg-accent/90" size="lg">
						View All Services
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</Link>
			</div>
		</div>
	</section>
);
