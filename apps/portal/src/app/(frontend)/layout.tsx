import { Work_Sans } from "next/font/google";
import type React from "react";
import "@/app/(frontend)/global.css";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";

const workSans = Work_Sans({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-work-sans",
});

export const metadata: Metadata = {
	title: "Madagascar Services Portal - Government Services Online",
	description:
		"Access government services online in Madagascar. Apply for documents, pay taxes, and access public services easily.",
	generator: "Payload CMS",
	applicationName: "Madagascar Services Portal",
	keywords: [
		"Madagascar",
		"government services",
		"online services",
		"public services",
		"citizen services",
		"e-government",

		"digital services",
	],
};

export default async function RootLayout(props: { children: React.ReactNode }) {
	const { children } = props;

	return (
		<html className={`${workSans.variable}`} lang="en">
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					disableTransitionOnChange
					enableSystem
				>
					<Header />
					<main>{children}</main>
					<Footer />
				</ThemeProvider>
			</body>
		</html>
	);
}
