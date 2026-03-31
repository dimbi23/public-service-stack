import { parseServiceCatalog } from "@/utilities/parse-service-catalog";
import { resolveCategory } from "@/utilities/resolve-category";
import { resolveDepartment } from "@/utilities/resolve-department";
import { resolveTenant } from "@/utilities/resolve-tenant";
import { jobQueue } from "./job-queue";

export interface ImportServicesJobData {
	fileBuffer: Buffer;
	fileName: string;
	userId?: number;
}

export async function processImportServicesJob(
	payload: any,
	jobId: string,
	data: ImportServicesJobData,
): Promise<void> {
	const { fileBuffer, fileName, userId } = data;

	// Resolve a super-admin context for tenant / category / department lookups
	let superAdminUser: any = null;
	try {
		const result = await payload.find({
			collection: "users",
			where: { roles: { contains: "admin" } },
			limit: 1,
			overrideAccess: true,
		});
		if (result.docs.length > 0) superAdminUser = result.docs[0];
	} catch (err) {
		console.error("Error finding super-admin user:", err);
	}

	// Fallback tenant from the uploading user
	let fallbackTenantId: number | undefined;
	if (userId) {
		try {
			const user = await payload.findByID({
				collection: "users",
				id: userId,
				overrideAccess: true,
			});
			const ids: number[] = (user?.tenants ?? [])
				.filter((t: any) => t.roles?.includes("tenant-admin"))
				.map((t: any) =>
					typeof t.tenant === "object" ? t.tenant.id : t.tenant,
				)
				.filter(Boolean);
			fallbackTenantId = ids[0];
		} catch (err) {
			console.error("Error fetching user for import job:", err);
		}
	}

	try {
		jobQueue.markProcessing(jobId);

		const parseResult = await parseServiceCatalog(fileBuffer, fileName);
		jobQueue.updateJob(jobId, { total: parseResult.totalRows });

		let successful = 0;
		const errors: Array<{ row: number; message: string }> = [];

		for (const row of parseResult.rows) {
			const rowNum = row.rowNumber ?? 0;

			// Fatal parse / normalisation errors — skip row
			if (row.errors.length > 0) {
				const msg = row.errors.join("; ");
				errors.push({ row: rowNum, message: msg });
				jobQueue.addError(jobId, rowNum, msg);
				continue;
			}

			const svc = row.service;
			const mockReq = superAdminUser
				? ({ user: superAdminUser, payload } as any)
				: undefined;

			// ── Resolve tenant from owner.ministry ──────────────────────────────
			let tenantId: number | undefined = fallbackTenantId;
			if (svc.owner.ministry) {
				const resolved = await resolveTenant(
					payload,
					svc.owner.ministry,
					mockReq,
				);
				if (resolved) {
					tenantId = resolved;
				} else {
					console.warn(
						`Row ${rowNum}: tenant "${svc.owner.ministry}" not resolved, falling back to user tenant`,
					);
				}
			}

			if (!tenantId) {
				const msg =
					"Tenant (ministry) is required — ensure TENANT column is set or user has a tenant assigned";
				errors.push({ row: rowNum, message: msg });
				jobQueue.addError(jobId, rowNum, msg);
				continue;
			}

			// ── Resolve category (optional) ─────────────────────────────────────
			let categoryId: number | undefined;
			if (svc._categoryName) {
				const resolved = await resolveCategory(payload, svc._categoryName, mockReq);
				if (resolved) {
					categoryId = resolved;
				} else {
					console.warn(`Row ${rowNum}: Could not resolve category: ${svc._categoryName}`);
				}
			}

			// ── Resolve department (optional) ────────────────────────────────────
			let departmentId: number | undefined;
			if (svc._departmentName) {
				const resolved = await resolveDepartment(payload, svc._departmentName, tenantId, mockReq);
				if (resolved) {
					departmentId = resolved;
				} else {
					console.warn(`Row ${rowNum}: Could not resolve department: ${svc._departmentName}`);
				}
			}

			// ── Build Payload document ──────────────────────────────────────────
			// Strip normalizer-internal fields before persisting
			const { _categoryName, _departmentName, ...serviceData } = svc;

			const payloadDoc = {
				...serviceData,
				...(categoryId ? { category: categoryId } : {}),
				...(departmentId ? { department: departmentId } : {}),
				tenant: tenantId,
				// Compute metrics from normalized data
				metrics: {
					documentsCount: svc.documentsRequired.length,
					manualRequiredShare:
						svc.workflow.steps.length > 0
							? svc.workflow.steps.filter(
									(s) => s.confidence === "manual_required",
							  ).length / svc.workflow.steps.length
							: 1,
				},
			};

			// ── Upsert by serviceId ─────────────────────────────────────────────
			try {
				const existing = await payload.find({
					collection: "services",
					where: { serviceId: { equals: svc.serviceId } },
					limit: 1,
					overrideAccess: true,
				});

				if (existing.docs.length > 0) {
					await payload.update({
						collection: "services",
						id: existing.docs[0].id,
						data: payloadDoc,
						overrideAccess: true,
					});
				} else {
					await payload.create({
						collection: "services",
						data: payloadDoc,
						overrideAccess: true,
					});
				}

				// ── Create / update ExecutionMapping ────────────────────────────
				await upsertExecutionMapping(payload, svc, overrideAccess);

				successful++;
				jobQueue.incrementProgress(jobId);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				errors.push({ row: rowNum, message: msg });
				jobQueue.addError(jobId, rowNum, msg);
			}
		}

		jobQueue.markCompleted(jobId, {
			successful,
			failed: errors.length,
			total: parseResult.totalRows,
			errors,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		jobQueue.markFailed(jobId, msg);
		throw err;
	}
}

// ── ExecutionMapping upsert helper ────────────────────────────────────────────

async function upsertExecutionMapping(
	payload: any,
	svc: import("@org/normalizer").NormalizedService,
	_overrideAccess: true,
): Promise<void> {
	const mappingData: Record<string, unknown> & { serviceId: string } = {
		serviceId: svc.serviceId,
		normalizationConfidence: svc.workflow.normalizationConfidence,
		reviewStatus: svc.workflow.reviewStatus === "approved_auto"
			? "approved"
			: svc.workflow.reviewStatus === "review_required"
				? "review_required"
				: "manual_required",
		process: {
			processId: `proc_${svc.slug}`,
			version: "1.0.0",
			actor: svc.workflow.steps[0]?.actor ?? "unknown",
			channel: svc.access.channel,
			estimatedDurationDays: svc.processingTime.slaDays,
			steps: svc.workflow.steps.map((step) => ({
				stepId: step.stepId,
				order: step.order,
				label: step.label,
				stepType: step.stepType,
				actor: step.actor,
				channel: step.channel,
				requiresPayment: step.requiresPayment,
				slaDays: step.slaDays,
				automatable: step.stepType === "payment" ? false : undefined,
				confidence: step.confidence,
			})),
		},
	};

	// Link to the Services document
	const serviceDoc = await payload.find({
		collection: "services",
		where: { serviceId: { equals: svc.serviceId } },
		limit: 1,
		overrideAccess: true,
	});
	if (serviceDoc.docs.length > 0) {
		mappingData.service = serviceDoc.docs[0].id;
	}

	const existing = await payload.find({
		collection: "execution-mappings",
		where: { serviceId: { equals: svc.serviceId } },
		limit: 1,
		overrideAccess: true,
	});

	if (existing.docs.length > 0) {
		await payload.update({
			collection: "execution-mappings",
			id: existing.docs[0].id,
			data: mappingData,
			overrideAccess: true,
		});
	} else {
		await payload.create({
			collection: "execution-mappings",
			data: mappingData,
			overrideAccess: true,
		});
	}
}

// TypeScript placeholder for overrideAccess pattern
const overrideAccess = true as true;

export async function startImportServicesJob(
	payload: any,
	jobId: string,
	data: ImportServicesJobData,
): Promise<void> {
	setImmediate(async () => {
		try {
			await processImportServicesJob(payload, jobId, data);
		} catch (err) {
			console.error(`Job ${jobId} failed:`, err);
		}
	});
}
