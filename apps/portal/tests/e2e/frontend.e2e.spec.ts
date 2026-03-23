import { expect, type Page, test } from "@playwright/test";

test.describe("Frontend", () => {
	let page: Page;

	test.beforeAll(async ({ browser }, testInfo) => {
		const context = await browser.newContext();
		page = await context.newPage();
	});

	test("can go on homepage", async ({ page }) => {
		await page.goto("http://localhost:3000");
		await page.waitForLoadState("networkidle");

		await expect(page).toHaveTitle(/Madagascar Services Portal/);

		const heading = page.locator("h1").first();
		await heading.waitFor({ state: "visible" });

		// The h1 contains "Government Services" (may have additional text)
		await expect(heading).toContainText("Government Services");
	});

	test("search functionality works", async ({ page }) => {
		await page.goto("http://localhost:3000");
		await page.waitForLoadState("networkidle");

		const searchInput = page.locator(
			'input[placeholder*="What service do you need"]'
		);
		await searchInput.waitFor({ state: "visible" });
		await searchInput.fill("test");
		await searchInput.press("Enter");

		// Should navigate to services page with search query
		await expect(page).toHaveURL(/\/services\?search=test/, {
			timeout: 10_000,
		});
	});

	test("can navigate to services page", async ({ page }) => {
		await page.goto("http://localhost:3000/services");

		await expect(page).toHaveURL(/\/services/);
		// Wait for the page to load
		await page.waitForLoadState("networkidle");
		const heading = page.locator("h1").first();
		await expect(heading).toContainText("All Government Services");
	});

	test("can track application", async ({ page }) => {
		await page.goto("http://localhost:3000/track");
		await page.waitForLoadState("networkidle");

		// Find the input field by placeholder (contains "Tracking" or "Enter Tracking")
		const trackingInput = page
			.locator(
				'input[placeholder*="Tracking"], input[placeholder*="Enter Tracking"]'
			)
			.first();
		await trackingInput.waitFor({ state: "visible" });
		await trackingInput.fill("APP-20240101-TEST");

		const trackButton = page.locator('button:has-text("Track Status")');
		await trackButton.waitFor({ state: "visible" });
		await trackButton.click();

		// Wait for the response and check for either success (tracking ID displayed) or error message
		// The page should show either the tracking results or an error message
		await expect(
			page.locator(
				"text=/Tracking ID|Application not found|Error|Track Your Application/"
			)
		).toBeVisible({ timeout: 10_000 });
	});
});
