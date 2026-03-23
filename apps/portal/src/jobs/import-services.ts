import { getUserTenantIDs } from "@/utilities/get-user-tenant-id";
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

/**
 * Process service import job
 */
export async function processImportServicesJob(
	payload: any,
	jobId: string,
	data: ImportServicesJobData
): Promise<void> {
	const { fileBuffer, fileName, userId } = data;

	// Find a super admin user to run the import with super admin privileges
	let superAdminUser: any = null;
	try {
		const superAdmins = await payload.find({
			collection: "users",
			where: {
				roles: {
					contains: "admin",
				},
			},
			limit: 1,
			overrideAccess: true,
		});

		if (superAdmins.docs.length > 0) {
			superAdminUser = superAdmins.docs[0];
		}
	} catch (error) {
		console.error("Error finding super admin user:", error);
	}

	// Get user's tenant ID if userId is provided (as fallback)
	let tenantId: number | undefined;
	if (userId) {
		try {
			const user = await payload.findByID({
				collection: "users",
				id: userId,
				overrideAccess: true,
			});
			const tenantIDs = getUserTenantIDs(user, "tenant-admin");
			// Use the first tenant the user has admin access to
			tenantId = tenantIDs.length > 0 ? tenantIDs[0] : undefined;
		} catch (error) {
			console.error("Error fetching user for import job:", error);
		}
	}

	try {
		// Mark job as processing
		jobQueue.markProcessing(jobId);

		// Parse the file
		const parseResult = await parseServiceCatalog(fileBuffer, fileName);

		// Update job with total count
		jobQueue.updateJob(jobId, {
			total: parseResult.totalRows,
		});

		let successful = 0;
		const errors: Array<{ row: number; message: string }> = [];

		// Process each row
		for (const row of parseResult.rows) {
			try {
				// Skip rows with validation errors
				if (row.errors.length > 0) {
					errors.push({
						row: row.rowNumber,
						message: row.errors.join("; "),
					});
					jobQueue.addError(
						jobId,
						row.rowNumber,
						row.errors.join("; ")
					);
					continue;
				}

				// Resolve tenant (ministry) from row data, or fall back to user's tenant
				let rowTenantId: number | undefined = tenantId;
				const tenantName = (row.data as any).tenantName;
				if (tenantName) {
					// Use super admin context for tenant resolution
					// Create a mock request object with super admin user
					const mockReq = superAdminUser
						? ({
								user: superAdminUser,
								payload,
							} as any)
						: undefined;

					const resolvedTenantId = await resolveTenant(
						payload,
						tenantName,
						mockReq
					);
					if (resolvedTenantId) {
						rowTenantId = resolvedTenantId;
					} else {
						// If tenant resolution fails, log warning but continue with user's tenant
						console.warn(
							`Failed to resolve tenant "${tenantName}" for row ${row.rowNumber}, using user's tenant`
						);
					}
				}

				// If no tenant found, skip this row
				if (!rowTenantId) {
					errors.push({
						row: row.rowNumber,
						message:
							"Tenant (ministry) is required. Please ensure the file contains tenant information or the user has a tenant assigned.",
					});
					jobQueue.addError(
						jobId,
						row.rowNumber,
						"Tenant (ministry) is required"
					);
					continue;
				}

				// Create a mock request object with super admin user for all operations
				const mockReq = superAdminUser
					? ({
							user: superAdminUser,
							payload,
						} as any)
					: undefined;

				// Resolve category (using super admin context)
				const categoryName = (row.data as any).categoryName;
				if (categoryName) {
					const categoryId = await resolveCategory(
						payload,
						categoryName,
						mockReq
					);
					if (categoryId) {
						row.data.category = categoryId;
					} else {
						errors.push({
							row: row.rowNumber,
							message: `Failed to resolve or create category: ${categoryName}`,
						});
						jobQueue.addError(
							jobId,
							row.rowNumber,
							`Failed to resolve or create category: ${categoryName}`
						);
						continue;
					}
				} else {
					errors.push({
						row: row.rowNumber,
						message: "Category is required",
					});
					jobQueue.addError(
						jobId,
						row.rowNumber,
						"Category is required"
					);
					continue;
				}

				// Resolve department (using super admin context)
				const departmentName = (row.data as any).departmentName;
				if (departmentName) {
					const departmentId = await resolveDepartment(
						payload,
						departmentName,
						rowTenantId,
						mockReq
					);
					if (departmentId) {
						row.data.department = departmentId;
					} else {
						errors.push({
							row: row.rowNumber,
							message: `Failed to resolve or create department: ${departmentName}`,
						});
						jobQueue.addError(
							jobId,
							row.rowNumber,
							`Failed to resolve or create department: ${departmentName}`
						);
						continue;
					}
				} else {
					errors.push({
						row: row.rowNumber,
						message: "Department is required",
					});
					jobQueue.addError(
						jobId,
						row.rowNumber,
						"Department is required"
					);
					continue;
				}

				// Set tenant on the service
				row.data.tenant = rowTenantId;

				// Remove temporary fields
				delete (row.data as any).categoryName;
				delete (row.data as any).departmentName;
				delete (row.data as any).tenantName;

				// Check if service already exists by slug (generated from name)
				const slug = row.data.name
					?.toLowerCase()
					.replace(/ /g, "-")
					.replace(/[^\w-]+/g, "");

				if (slug) {
					// Build where clause with tenant filter
					const whereClause: any = {
						slug: {
							equals: slug,
						},
					};

					// If we have a tenant, also filter by tenant
					if (rowTenantId) {
						whereClause.tenant = {
							equals: rowTenantId,
						};
					}

					const existing = await payload.find({
						collection: "services",
						where: whereClause,
						limit: 1,
						overrideAccess: true,
					});

					if (existing.docs.length > 0) {
						// Update existing service
						await payload.update({
							collection: "services",
							id: existing.docs[0].id,
							data: row.data,
							overrideAccess: true,
						});
					} else {
						// Create new service
						await payload.create({
							collection: "services",
							data: row.data,
							overrideAccess: true,
						});
					}

					successful++;
					jobQueue.incrementProgress(jobId);
				} else {
					errors.push({
						row: row.rowNumber,
						message: "Service name is required for slug generation",
					});
					jobQueue.addError(
						jobId,
						row.rowNumber,
						"Service name is required for slug generation"
					);
				}
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				errors.push({
					row: row.rowNumber,
					message: errorMessage,
				});
				jobQueue.addError(jobId, row.rowNumber, errorMessage);
			}
		}

		// Mark job as completed
		jobQueue.markCompleted(jobId, {
			successful,
			failed: errors.length,
			total: parseResult.totalRows,
			errors,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		jobQueue.markFailed(jobId, errorMessage);
		throw error;
	}
}

/**
 * Start import job asynchronously
 */
export async function startImportServicesJob(
	payload: any,
	jobId: string,
	data: ImportServicesJobData
): Promise<void> {
	// Process in background (non-blocking)
	setImmediate(async () => {
		try {
			await processImportServicesJob(payload, jobId, data);
		} catch (error) {
			console.error(`Job ${jobId} failed:`, error);
		}
	});
}
