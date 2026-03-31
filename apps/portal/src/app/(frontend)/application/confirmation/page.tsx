import { Suspense } from "react";
import { ConfirmationContent } from "./ConfirmationContent";

export const dynamic = "force-dynamic";

export default function ConfirmationPage() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto px-4 py-12">
					<p>Loading...</p>
				</div>
			}
		>
			<ConfirmationContent />
		</Suspense>
	);
}
