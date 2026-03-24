// ── n8n REST API v1 response types ───────────────────────────────────────────
// Subset of the API surface used by wbb-service.
// Full reference: https://docs.n8n.io/api/

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: N8nNode[];
  tags?: N8nTag[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  webhookId?: string;
}

export interface N8nTag {
  id: string;
  name: string;
}

export interface N8nWorkflowList {
  data: N8nWorkflow[];
  nextCursor: string | null;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf: string | null;
  retrySuccessId: string | null;
  startedAt: string;
  stoppedAt: string | null;
  workflowId: string;
  status: 'new' | 'running' | 'success' | 'error' | 'canceled' | 'waiting';
  data?: Record<string, unknown>;
}

/** Payload sent by wbb-service to n8n webhook trigger nodes. */
export interface N8nWebhookPayload {
  caseId: string;
  serviceId: string;
  applicantId: string;
  submissionId?: string;
  stepId?: string;
  /** Full execution mapping process from procedures-api internal profile */
  executionProcess?: Record<string, unknown>;
  /** Callback URL that n8n must POST to when a step completes */
  callbackUrl: string;
  meta?: Record<string, unknown>;
}

/** Shape of the callback that n8n sends back to wbb-service. */
export interface N8nStepCallback {
  caseId: string;
  stepId: string;
  outcome: 'approved' | 'rejected' | 'forwarded' | 'completed';
  actorId?: string;
  note?: string;
  nextStepId?: string;
  executionId?: string;
}
