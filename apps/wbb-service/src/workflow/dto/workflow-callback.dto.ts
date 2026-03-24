export class WorkflowCallbackDto {
  caseId!: string;
  stepId!: string;
  outcome!: 'approved' | 'rejected' | 'forwarded' | 'completed';
  actorId?: string;
  note?: string;
  /** If set, wbb-service will trigger the next step automatically */
  nextStepId?: string;
  executionId?: string;
}
