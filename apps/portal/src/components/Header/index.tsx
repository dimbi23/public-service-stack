import {
	Bell,
	Globe,
	LogOut,
	Menu,
	Search,
	Settings,
	User,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function Header() {
	// Mock user state - in a real app, this would come from authentication context
	const isLoggedIn = false; // Set to false to show sign in state by default
	const user = {
		name: "Rakoto Andry",
		email: "rakoto.andry@email.mg",
		avatar: "/professional-headshot.png",
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background">
			<div className="container mx-auto px-4">
				<div className="flex h-18 items-center justify-between">
					{/* Logo and Title */}
					<div className="flex items-center gap-4">
						<Link className="flex items-center gap-2" href="/">
							<Logo />
						</Link>
					</div>

					{/* Navigation Links */}
					<nav className="hidden items-center gap-6 md:flex">
						<Link
							className="font-medium text-sm transition-colors hover:text-accent"
							href="/"
						>
							Home
						</Link>
						<Link
							className="font-medium text-sm transition-colors hover:text-accent"
							href="/services"
						>
							All Services
						</Link>
						{isLoggedIn && (
							<Link
								className="font-medium text-sm transition-colors hover:text-accent"
								href="/dashboard"
							>
								My Dashboard
							</Link>
						)}
						<Link
							className="font-medium text-sm transition-colors hover:text-accent"
							href="/help"
						>
							Help
						</Link>
					</nav>

					{/* Search Bar */}
					<div className="mx-8 hidden max-w-md flex-1 lg:flex">
						<div className="relative w-full">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								className="bg-muted pl-10 shadow-sm focus:ring-2 focus:ring-accent"
								placeholder="Search for services..."
							/>
						</div>
					</div>

					{/* Navigation Actions */}
					<div className="flex items-center gap-2">
						<Button
							className="hidden md:flex"
							size="sm"
							variant="ghost"
						>
							<Globe className="mr-2 h-4 w-4" />
							EN
						</Button>
						<ModeToggle />

						{isLoggedIn ? (
							<>
								{/* Notifications */}
								<Button
									className="relative"
									size="sm"
									variant="ghost"
								>
									<Bell className="h-4 w-4" />
									<Badge
										className="-top-1 -right-1 absolute h-5 w-5 rounded-full p-0 text-xs"
										variant="destructive"
									>
										3
									</Badge>
								</Button>

								{/* User Menu */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											className="relative h-8 w-8 rounded-full"
											variant="ghost"
										>
											<Avatar className="h-8 w-8">
												<AvatarImage
													alt={user.name}
													src={
														user.avatar ||
														"/placeholder.svg"
													}
												/>
												<AvatarFallback className="bg-accent text-accent-foreground">
													{user.name
														.split(" ")
														.map((n) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="w-56"
										forceMount
									>
										<DropdownMenuLabel className="font-normal">
											<div className="flex flex-col space-y-1">
												<p className="font-medium text-sm leading-none">
													{user.name}
												</p>
												<p className="text-muted-foreground text-xs leading-none">
													{user.email}
												</p>
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href="/dashboard">
												<User className="mr-2 h-4 w-4" />
												<span>Dashboard</span>
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem>
											<Settings className="mr-2 h-4 w-4" />
											<span>Settings</span>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem>
											<LogOut className="mr-2 h-4 w-4" />
											<span>Log out</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<Link href="/auth/login">
								<Button size="sm" variant="ghost">
									<User className="mr-2 h-4 w-4" />
									Sign In
								</Button>
							</Link>
						)}

						<Button className="md:hidden" size="sm" variant="ghost">
							<Menu className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
