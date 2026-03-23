import { Facebook, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export function Footer() {
	return (
		<footer className="text-foreground">
			<div className="container mx-auto px-4 py-12">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
					{/* About Section */}
					<div>
						<div className="mb-4 flex items-center gap-2">
							<Logo className="h-10 w-auto" />
						</div>
						<p className="mb-4 text-foreground/80 text-sm">
							Your gateway to all government services in
							Madagascar. Serving citizens with transparency and
							efficiency.
						</p>
						<div className="flex gap-2">
							<Button
								className="text-foreground hover:bg-foreground/10"
								size="sm"
								variant="ghost"
							>
								<Facebook className="h-4 w-4" />
							</Button>
							<Button
								className="text-foreground hover:bg-foreground/10"
								size="sm"
								variant="ghost"
							>
								<Twitter className="h-4 w-4" />
							</Button>
							<Button
								className="text-foreground hover:bg-foreground/10"
								size="sm"
								variant="ghost"
							>
								<Youtube className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Quick Links */}
					<div>
						<h4 className="mb-4 font-semibold">Quick Links</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									All Services
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Application Status
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Payment Portal
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Help Center
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Contact Us
								</a>
							</li>
						</ul>
					</div>

					{/* Popular Services */}
					<div>
						<h4 className="mb-4 font-semibold">Popular Services</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Passport Application
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Business Registration
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Tax Payment
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Birth Certificate
								</a>
							</li>
							<li>
								<a
									className="text-foreground/80 transition-colors hover:text-foreground"
									href="/"
								>
									Marriage Certificate
								</a>
							</li>
						</ul>
					</div>

					{/* Contact Info */}
					<div>
						<h4 className="mb-4 font-semibold">
							Contact Information
						</h4>
						<div className="space-y-3 text-sm">
							<div className="flex items-center gap-2">
								<Phone className="h-4 w-4" />
								<span className="text-foreground/80">
									+261 20 22 123 45
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Mail className="h-4 w-4" />
								<span className="text-foreground/80">
									support@gov.mg
								</span>
							</div>
							<div className="flex items-start gap-2">
								<MapPin className="mt-0.5 h-4 w-4" />
								<span className="text-foreground/80">
									Government Building
									<br />
									Antananarivo, Madagascar
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-8 border-primary-foreground/20 border-t pt-8 text-center">
					<p className="text-foreground/60 text-sm">
						© 2025 Republic of Madagascar. All rights reserved. |
						Privacy Policy | Terms of Service
					</p>
				</div>
			</div>
		</footer>
	);
}
