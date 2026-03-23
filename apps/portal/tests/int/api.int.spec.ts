import { getPayload, type Payload } from "payload";
import { beforeAll, describe, expect, it } from "vitest";
import config from "@/payload.config";
import type {
	Application,
	Form,
	FormSubmission,
	Service,
} from "@/payload-types";

let payload: Payload;

describe("API", () => {
	beforeAll(async () => {
		const payloadConfig = await config;
		payload = await getPayload({ config: payloadConfig });
	});

	it("fetches users", async () => {
		const users = await payload.find({
			collection: "users",
		});
		expect(users).toBeDefined();
	});

	describe("Application Creation", () => {
		let testForm: Form;
		let testService: Service;
		let testSubmission: FormSubmission;

		beforeAll(async () => {
			// Create a test form
			testForm = (await payload.create({
				collection: "forms",
				data: {
					title: "Test Application Form",
					fields: [
						{
							blockType: "text",
							name: "fullName",
							label: "Full Name",
							required: true,
						},
						{
							blockType: "email",
							name: "email",
							label: "Email",
							required: true,
						},
					],
				},
			})) as Form;

			// Create a test category first
			const category = await payload.create({
				collection: "categories",
				data: {
					name: "Test Category",
					slug: "test-category",
				},
			});

			// Create a test department
			const department = await payload.create({
				collection: "departments",
				data: {
					name: "Test Department",
					slug: "test-department",
				},
			});

			// Create a test service with the form
			testService = (await payload.create({
				collection: "services",
				data: {
					name: "Test Service",
					slug: "test-service",
					category: category.id,
					department: department.id,
					type: "G2C",
					access: "online",
					form: testForm.id,
				},
			})) as Service;

			// Create a test form submission
			testSubmission = (await payload.create({
				collection: "form-submissions",
				data: {
					form: testForm.id,
					submissionData: [
						{
							field: "fullName",
							value: "Test User",
						},
						{
							field: "email",
							value: "test@example.com",
						},
					],
				},
			})) as FormSubmission;
		});

		it("creates application from form submission", async () => {
			// The createApplication hook should have created an application
			// Wait a bit for the hook to execute
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const applications = await payload.find({
				collection: "applications",
				where: {
					submission: {
						equals: testSubmission.id,
					},
				},
			});

			expect(applications.docs.length).toBeGreaterThan(0);
			const application = applications.docs[0] as Application;
			expect(application.trackingId).toMatch(/^APP-\d{8}-[A-Z0-9]+$/);
			expect(application.status).toBe("pending");
			expect(application.service).toBe(testService.id);
			expect(application.applicantEmail).toBe("test@example.com");
		});

		it("links service to application correctly", async () => {
			const applications = await payload.find({
				collection: "applications",
				where: {
					submission: {
						equals: testSubmission.id,
					},
				},
				depth: 1,
			});

			const application = applications.docs[0] as Application;
			if (
				typeof application.service === "object" &&
				application.service
			) {
				expect(application.service.id).toBe(testService.id);
			} else {
				expect(application.service).toBe(testService.id);
			}
		});
	});

	describe("Tracking Endpoint", () => {
		let testApplication: Application;

		beforeAll(async () => {
			// Create a test application directly for tracking tests
			const form = await payload.create({
				collection: "forms",
				data: {
					title: "Tracking Test Form",
					fields: [],
				},
			});

			const submission = await payload.create({
				collection: "form-submissions",
				data: {
					form: form.id,
					submissionData: [
						{
							field: "email",
							value: "tracking@example.com",
						},
					],
				},
			});

			testApplication = (await payload.create({
				collection: "applications",
				data: {
					trackingId: "APP-20240101-TEST",
					status: "pending",
					submission: submission.id,
					applicantEmail: "tracking@example.com",
					timeline: [
						{
							status: "pending",
							timestamp: new Date().toISOString(),
							note: "Application received",
						},
					],
				},
			})) as Application;
		});

		it("tracks application by tracking ID", async () => {
			const response = await fetch(
				`http://localhost:3000/api/track-application?trackingId=${testApplication.trackingId}`
			);
			const data = await response.json();

			expect(response.ok).toBe(true);
			expect(data.trackingId).toBe(testApplication.trackingId);
			expect(data.status).toBe("pending");
			expect(data.timeline).toBeDefined();
		});

		it("validates email when provided", async () => {
			// Correct email
			const correctResponse = await fetch(
				`http://localhost:3000/api/track-application?trackingId=${testApplication.trackingId}&email=tracking@example.com`
			);
			expect(correctResponse.ok).toBe(true);

			// Incorrect email
			const incorrectResponse = await fetch(
				`http://localhost:3000/api/track-application?trackingId=${testApplication.trackingId}&email=wrong@example.com`
			);
			expect(incorrectResponse.status).toBe(403);
		});

		it("returns 404 for non-existent tracking ID", async () => {
			const response = await fetch(
				"http://localhost:3000/api/track-application?trackingId=APP-99999999-FAKE"
			);
			expect(response.status).toBe(404);
		});
	});
});
