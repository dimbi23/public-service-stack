import { Injectable, Logger, NotFoundException } from '@nestjs/common';

/**
 * WorkflowRegistration — maps a procedure (serviceId pattern) to an n8n
 * workflow via its webhook path.
 *
 * webhookPath is the path configured in the n8n Webhook trigger node,
 * e.g. "case-submitted" → POST http://n8n:5678/webhook/case-submitted
 *
 * TODO: persist in PostgreSQL (or in ExecutionMappings collection) so
 *       registrations survive restarts.
 */
export interface WorkflowRegistration {
  /** Exact serviceId or glob pattern, e.g. "MAM-*" */
  serviceIdPattern: string;
  /** n8n webhook path for the "case submitted" trigger */
  webhookPath: string;
  /** Human-readable workflow name (for logs) */
  workflowName?: string;
  /** n8n workflow ID (for status queries via REST API) */
  n8nWorkflowId?: string;
  registeredAt: string;
}

@Injectable()
export class WorkflowRegistry {
  private readonly logger = new Logger(WorkflowRegistry.name);
  private readonly registrations = new Map<string, WorkflowRegistration>();

  register(reg: Omit<WorkflowRegistration, 'registeredAt'>): WorkflowRegistration {
    const full: WorkflowRegistration = { ...reg, registeredAt: new Date().toISOString() };
    this.registrations.set(reg.serviceIdPattern, full);
    this.logger.log(`Registered workflow "${reg.workflowName ?? reg.webhookPath}" for pattern "${reg.serviceIdPattern}"`);
    return full;
  }

  unregister(serviceIdPattern: string): void {
    this.registrations.delete(serviceIdPattern);
  }

  /**
   * Finds the best-matching registration for a given serviceId.
   * Priority: exact match > wildcard match (prefix with *)
   */
  resolve(serviceId: string): WorkflowRegistration | undefined {
    // Exact match first
    if (this.registrations.has(serviceId)) {
      return this.registrations.get(serviceId);
    }

    // Wildcard — pattern "MAM-*" matches "MAM-CENAM-B-P1"
    for (const [pattern, reg] of this.registrations.entries()) {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        if (serviceId.startsWith(prefix)) return reg;
      }
    }

    return undefined;
  }

  resolveOrThrow(serviceId: string): WorkflowRegistration {
    const reg = this.resolve(serviceId);
    if (!reg) {
      throw new NotFoundException(
        `No workflow registered for serviceId "${serviceId}". ` +
        `Register one via POST /v1/workflow/register`,
      );
    }
    return reg;
  }

  listAll(): WorkflowRegistration[] {
    return Array.from(this.registrations.values());
  }
}
