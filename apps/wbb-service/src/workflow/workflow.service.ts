import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { N8nClient } from '../n8n/n8n.client';
import { ProceduresClient } from '../procedures/procedures.client';
import { CasesClient } from '../cases/cases.client';
import { WorkflowRegistry } from './workflow.registry';
import type { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import type { WorkflowCallbackDto } from './dto/workflow-callback.dto';
import type { RegisterWorkflowDto } from './dto/register-workflow.dto';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private readonly selfUrl: string;

  constructor(
    private readonly n8n: N8nClient,
    private readonly procedures: ProceduresClient,
    private readonly cases: CasesClient,
    private readonly registry: WorkflowRegistry,
    private readonly config: ConfigService,
  ) {
    this.selfUrl = this.config.get<string>('WBB_BASE_URL', 'http://localhost:3003');
  }

  // ── Register ──────────────────────────────────────────────────────────────

  register(dto: RegisterWorkflowDto) {
    return this.registry.register(dto);
  }

  listRegistrations() {
    return this.registry.listAll();
  }

  // ── Trigger ───────────────────────────────────────────────────────────────

  /**
   * Called when a case is submitted.
   * 1. Resolve which n8n workflow handles this service
   * 2. Fetch the ExecutionMapping from procedures-api (internal profile)
   * 3. Trigger the n8n workflow via its webhook path
   */
  async trigger(dto: TriggerWorkflowDto): Promise<{ triggered: boolean; webhookPath: string }> {
    const registration = this.registry.resolveOrThrow(dto.serviceId);

    // Fetch execution mapping for context (best-effort — don't block if unavailable)
    let executionProcess: unknown;
    try {
      const procedure = await this.procedures.getProcedureInternal(dto.serviceId);
      executionProcess = procedure.executionMapping?.process;
    } catch (err) {
      this.logger.warn(
        `Could not fetch ExecutionMapping for ${dto.serviceId}: ${(err as Error).message}`,
      );
    }

    const callbackUrl = `${this.selfUrl}/v1/workflow/callback`;

    await this.n8n.triggerWebhook(registration.webhookPath, {
      caseId: dto.caseId,
      serviceId: dto.serviceId,
      applicantId: dto.applicantId,
      submissionId: dto.submissionId,
      executionProcess: executionProcess as Record<string, unknown> | undefined,
      callbackUrl,
    });

    this.logger.log(
      `Workflow triggered for case ${dto.caseId} via webhook "${registration.webhookPath}"`,
    );

    return { triggered: true, webhookPath: registration.webhookPath };
  }

  // ── Callback ──────────────────────────────────────────────────────────────

  /**
   * Called by n8n when a step completes.
   * 1. Mark the step complete on case-api
   * 2. Derive the new case status from the step outcome
   * 3. If nextStepId is provided, advance to the next step automatically
   */
  async handleCallback(dto: WorkflowCallbackDto): Promise<void> {
    this.logger.log(
      `Callback received for case ${dto.caseId} — step ${dto.stepId} → ${dto.outcome}`,
    );

    // Mark step complete
    await this.cases.completeStep(
      dto.caseId,
      dto.stepId,
      dto.outcome,
      dto.actorId,
      dto.note,
    );

    // Derive status transition from outcome
    const newStatus = this.outcomeToStatus(dto.outcome);
    if (newStatus) {
      try {
        await this.cases.updateStatus(dto.caseId, { status: newStatus, note: dto.note, actorId: dto.actorId });
        this.logger.log(`Case ${dto.caseId} transitioned to ${newStatus}`);
      } catch (err) {
        // Transition may be invalid (e.g. terminal state) — log and continue
        this.logger.warn(`Status transition failed for case ${dto.caseId}: ${(err as Error).message}`);
      }
    }
  }

  // ── n8n connectivity ──────────────────────────────────────────────────────

  async checkN8nConnectivity(): Promise<{ reachable: boolean }> {
    const reachable = await this.n8n.ping();
    return { reachable };
  }

  async listN8nWorkflows() {
    return this.n8n.listWorkflows();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private outcomeToStatus(
    outcome: WorkflowCallbackDto['outcome'],
  ): 'under_review' | 'approved' | 'rejected' | null {
    switch (outcome) {
      case 'approved':  return 'approved';
      case 'rejected':  return 'rejected';
      case 'forwarded': return 'under_review';
      case 'completed': return null; // intermediate step — no status change
    }
  }
}
