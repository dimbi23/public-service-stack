import { ArrowRight } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Category } from "@/payload-types";

interface ServiceCategoryCardProps {
	category: Category;
}

export default function ServiceCategoryCard({
	category,
}: ServiceCategoryCardProps) {
	return (
		<Card className="group h-full cursor-pointer shadow-none transition-all duration-200 hover:shadow-lg">
			<CardHeader className="pb-4">
				<div
					className={`h-12 w-12 rounded-lg bg-${category.color ? category.color : "gray"}-50 mb-4 flex items-center justify-center`}
				>
					<DynamicIcon
						className={`text-${category.color ? category.color : "gray"}-600 h-6 w-6`}
						name={
							category.icon
								? (category.icon as IconName)
								: "circle"
						}
					/>
				</div>
				<CardTitle className="text-lg transition-colors group-hover:text-accent">
					{category.name}
				</CardTitle>
				<CardDescription className="text-sm">
					{category.description}
				</CardDescription>
			</CardHeader>

			<CardContent className="pt-0">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-sm">
						{category.services?.docs &&
						category.services?.docs?.length <= 0
							? "No"
							: category.services?.docs?.length}{" "}
						service(s)
					</span>
					<ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
				</div>
			</CardContent>
		</Card>
	);
}
