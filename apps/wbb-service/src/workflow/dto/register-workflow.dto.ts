export class RegisterWorkflowDto {
  /** Exact serviceId or glob pattern, e.g. "MAM-*" */
  serviceIdPattern!: string;
  /** Path of the Webhook trigger node in n8n, e.g. "case-submitted" */
  webhookPath!: string;
  workflowName?: string;
  n8nWorkflowId?: string;
}
