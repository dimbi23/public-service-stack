/**
 * Service import job processor using BullMQ
 *
 * This module provides:
 * - The job processor function for BullMQ worker
 * - A helper to add jobs to the queue
 * - Backward compatibility with the old in-memory queue
 */

import { Queue, Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import {
  parseServiceCatalog,
  type ParseResult,
} from '@/utilities/parse-service-catalog';
import { resolveCategory } from '@/utilities/resolve-category';
import { resolveDepartment } from '@/utilities/resolve-department';
import { resolveTenant } from '@/utilities/resolve-tenant';
import {
  importQueue,
  createWorker,
  JobData,
  JobResult,
  JobProgress,
  getJobState,
  jobQueue as legacyJobQueue,
} from './bull-queue';
import type { Payload } from 'payload';

// Re-export types
export type { JobData, JobResult, JobProgress };
export { importQueue, getJobState, createWorker };

export interface ImportServicesJobData {
  fileBuffer: Buffer;
  fileName: string;
  userId?: number;
}

// ── Job Processor ────────────────────────────────────────────────────────────

/**
 * Main job processor function
 * This is called by BullMQ workers
 */
export async function processImportJob(
  bullJob: Job<JobData>,
  payload: Payload
): Promise<JobResult> {
  const { fileBuffer: base64Buffer, fileName, userId } = bullJob.data;
  const fileBuffer = Buffer.from(base64Buffer, 'base64');

  // Decode base64 back to buffer

  // Initialize progress tracking
  const progress: JobProgress = {
    completed: 0,
    failed: 0,
    total: 0,
    errors: [],
  };

  // Resolve a super-admin context for tenant / category / department lookups
  let superAdminUser: any = null;
  try {
    const result = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'admin' } },
      limit: 1,
      overrideAccess: true,
    });
    if (result.docs.length > 0) superAdminUser = result.docs[0];
  } catch (err) {
    console.error('Error finding super-admin user:', err);
  }

  // Fallback tenant from the uploading user
  let fallbackTenantId: number | undefined;
  if (userId) {
    try {
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        overrideAccess: true,
      });
      const ids: number[] = (user?.tenants ?? [])
        .filter((t: any) => t.roles?.includes('tenant-admin'))
        .map((t: any) =>
          typeof t.tenant === 'object' ? t.tenant.id : t.tenant
        )
        .filter(Boolean);
      fallbackTenantId = ids[0];
    } catch (err) {
      console.error('Error fetching user for import job:', err);
    }
  }

  try {
    const parseResult = await parseServiceCatalog(fileBuffer, fileName);
    progress.total = parseResult.totalRows;
    await bullJob.updateProgress(progress);

    for (const row of parseResult.rows) {
      const rowNum = row.rowNumber ?? 0;

      // Fatal parse / normalisation errors — skip row
      if (row.errors.length > 0) {
        const msg = row.errors.join('; ');
        progress.errors.push({ row: rowNum, message: msg });
        progress.failed += 1;
        progress.completed += 1;
        await bullJob.updateProgress(progress);
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
          mockReq
        );
        if (resolved) {
          tenantId = resolved;
        } else {
          console.warn(
            `Row ${rowNum}: tenant "${svc.owner.ministry}" not resolved, falling back to user tenant`
          );
        }
      }

      if (!tenantId) {
        const msg =
          'Tenant (ministry) is required — ensure TENANT column is set or user has a tenant assigned';
        progress.errors.push({ row: rowNum, message: msg });
        progress.failed += 1;
        progress.completed += 1;
        await bullJob.updateProgress(progress);
        continue;
      }

      // ── Resolve category (optional) ─────────────────────────────────────
      let categoryId: number | undefined;
      if (svc._categoryName) {
        const resolved = await resolveCategory(
          payload,
          svc._categoryName,
          mockReq
        );
        if (resolved) {
          categoryId = resolved;
        } else {
          console.warn(
            `Row ${rowNum}: Could not resolve category: ${svc._categoryName}`
          );
        }
      }

      // ── Resolve department (optional) ────────────────────────────────────
      let departmentId: number | undefined;
      if (svc._departmentName) {
        const resolved = await resolveDepartment(
          payload,
          svc._departmentName,
          tenantId,
          mockReq
        );
        if (resolved) {
          departmentId = resolved;
        } else {
          console.warn(
            `Row ${rowNum}: Could not resolve department: ${svc._departmentName}`
          );
        }
      }

      // ── Build Payload document ──────────────────────────────────────────
      const { _categoryName, _departmentName, ...serviceData } = svc;

      const payloadDoc = {
        ...serviceData,
        ...(categoryId ? { category: categoryId } : {}),
        ...(departmentId ? { department: departmentId } : {}),
        tenant: tenantId,
        metrics: {
          documentsCount: svc.documentsRequired.length,
          manualRequiredShare:
            svc.workflow.steps.length > 0
              ? svc.workflow.steps.filter(
                  (s) => s.confidence === 'manual_required'
                ).length / svc.workflow.steps.length
              : 1,
        },
      } as Record<string, unknown>;

      // ── Upsert by serviceId ─────────────────────────────────────────────
      try {
        const existing = await payload.find({
          collection: 'services',
          where: { serviceId: { equals: svc.serviceId } },
          limit: 1,
          overrideAccess: true,
        });

        if (existing.docs.length > 0) {
          await payload.update({
            collection: 'services',
            id: existing.docs[0].id,
            data: payloadDoc as any,
            overrideAccess: true,
          });
        } else {
          await payload.create({
            collection: 'services',
            data: payloadDoc as any,
            overrideAccess: true,
          });
        }

        await upsertExecutionMapping(payload, svc);

        progress.completed += 1;
        await bullJob.updateProgress(progress);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        progress.errors.push({ row: rowNum, message: msg });
        progress.failed += 1;
        progress.completed += 1;
        await bullJob.updateProgress(progress);
      }
    }

    return {
      successful: progress.completed - progress.failed,
      failed: progress.failed,
      total: progress.total,
      errors: progress.errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Job failed: ${msg}`);
  }
}

// ── ExecutionMapping Upsert Helper ─────────────────────────────────────────

async function upsertExecutionMapping(
  payload: Payload,
  svc: import('@org/normalizer').NormalizedService
): Promise<void> {
  const reviewStatus: 'approved' | 'review_required' | 'manual_required' =
    svc.workflow.reviewStatus === 'approved_auto'
      ? 'approved'
      : svc.workflow.reviewStatus === 'review_required'
      ? 'review_required'
      : 'manual_required';

  const mappingData = {
    serviceId: svc.serviceId,
    normalizationConfidence: svc.workflow.normalizationConfidence,
    reviewStatus,
    process: {
      processId: `proc_${svc.slug}`,
      version: '1.0.0',
      actor: svc.workflow.steps[0]?.actor ?? 'unknown',
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
        automatable: step.stepType === 'payment' ? false : undefined,
        confidence: step.confidence,
      })),
    },
  } as Record<string, unknown>;

  const serviceDoc = await payload.find({
    collection: 'services',
    where: { serviceId: { equals: svc.serviceId } },
    limit: 1,
    overrideAccess: true,
  });

  if (serviceDoc.docs.length > 0) {
    (mappingData as any).service = serviceDoc.docs[0].id;
  }

  const existing = await payload.find({
    collection: 'execution-mappings',
    where: { serviceId: { equals: svc.serviceId } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'execution-mappings',
      id: existing.docs[0].id,
      data: mappingData as any,
      overrideAccess: true,
    });
  } else {
    await payload.create({
      collection: 'execution-mappings',
      data: mappingData as any,
      overrideAccess: true,
    });
  }
}

// ── Legacy API Compatibility ───────────────────────────────────────────────

/**
 * Add a job to the queue
 *
 * This replaces the old `startImportServicesJob` pattern.
 * The job is now processed by BullMQ workers instead of setImmediate.
 */
export async function enqueueImportJob(
  payload: Payload,
  data: ImportServicesJobData
): Promise<{ jobId: string; status: string }> {
  const jobId = uuidv4();

  // Convert buffer to base64 for serialization
  const jobData: JobData = {
    fileBuffer: data.fileBuffer.toString('base64'),
    fileName: data.fileName,
    userId: data.userId,
  };

  // Add job to BullMQ queue
  const bullJob = await importQueue.add('import-services', jobData, {
    jobId,
    priority: 1,
  });

  // Also create in legacy queue for backward compatibility
  // This allows the status endpoint to work during transition
  await legacyJobQueue.createJob(jobId, 0);

  return {
    jobId: bullJob.id || jobId,
    status: 'waiting',
  };
}

/**
 * @deprecated Use enqueueImportJob instead.
 * Maintained for backward compatibility - now adds to BullMQ queue.
 */
export async function startImportServicesJob(
  payload: Payload,
  jobId: string,
  data: ImportServicesJobData
): Promise<void> {
  // Convert to BullMQ job
  const jobData: JobData = {
    fileBuffer: data.fileBuffer.toString('base64'),
    fileName: data.fileName,
    userId: data.userId,
  };

  await importQueue.add('import-services', jobData, {
    jobId,
    priority: 1,
  });
}
