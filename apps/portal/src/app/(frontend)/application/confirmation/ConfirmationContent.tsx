"use client";

import { CheckCircle, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfirmationContent() {
	const searchParams = useSearchParams();
	const trackingId = searchParams.get("trackingId");
	const submissionId = searchParams.get("submissionId");
	const [application, setApplication] = useState<{
		trackingId: string;
		status: string;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (trackingId) {
			setApplication({ trackingId, status: "pending" });
			setLoading(false);
		} else if (submissionId) {
			fetch(`/api/application-by-submission?submissionId=${submissionId}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.trackingId) {
						setApplication({
							trackingId: data.trackingId,
							status: data.status || "pending",
						});
					}
					setLoading(false);
				})
				.catch(() => {
					setLoading(false);
				});
		} else {
			setLoading(false);
		}
	}, [trackingId, submissionId]);

	const handleCopy = () => {
		if (application?.trackingId) {
			navigator.clipboard.writeText(application.trackingId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-12">
				<div className="mx-auto max-w-2xl text-center">
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	if (!application) {
		return (
			<div className="container mx-auto px-4 py-12">
				<div className="mx-auto max-w-2xl text-center">
					<h1 className="mb-4 font-bold text-2xl">
						Application Not Found
					</h1>
					<p className="mb-6 text-muted-foreground">
						We couldn't find your application. Please check your
						tracking ID or contact support.
					</p>
					<Link href="/track">
						<Button variant="outline">Track Application</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-12">
			<div className="mx-auto max-w-2xl">
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<CheckCircle className="h-8 w-8 text-green-600" />
						</div>
						<CardTitle className="text-2xl">
							Application Submitted Successfully!
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="rounded-lg bg-muted p-6">
							<p className="mb-2 text-muted-foreground text-sm">
								Your tracking ID:
							</p>
							<div className="flex items-center justify-between">
								<code className="font-mono font-semibold text-lg">
									{application.trackingId}
								</code>
								<Button
									onClick={handleCopy}
									size="sm"
									variant="outline"
								>
									{copied ? (
										<>
											<CheckCircle className="mr-2 h-4 w-4" />
											Copied!
										</>
									) : (
										<>
											<Copy className="mr-2 h-4 w-4" />
											Copy
										</>
									)}
								</Button>
							</div>
						</div>

						<div className="space-y-4">
							<p className="text-muted-foreground">
								Your application has been received and is
								currently being processed. You can use the
								tracking ID above to check the status of your
								application at any time.
							</p>

							<div className="flex flex-col gap-3 sm:flex-row">
								<Link className="flex-1" href="/track">
									<Button
										className="w-full"
										variant="outline"
									>
										<ExternalLink className="mr-2 h-4 w-4" />
										Track Your Application
									</Button>
								</Link>
								<Link className="flex-1" href="/services">
									<Button
										className="w-full"
										variant="outline"
									>
										Browse More Services
									</Button>
								</Link>
							</div>
						</div>

						<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
							<p className="text-blue-900 text-sm">
								<strong>What's next?</strong>
							</p>
							<ul className="mt-2 space-y-1 text-blue-800 text-sm">
								<li>
									• You will receive email updates about your
									application
								</li>
								<li>
									• Processing time varies by service type
								</li>
								<li>
									• Check back regularly for status updates
								</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
