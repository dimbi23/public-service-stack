// ─────────────────────────────────────────────────────────────────────────────
// @org/dto — inter-service Data Transfer Objects
//
// Used by: case-api, wbb-service, procedures-api
// Direction: these types define the wire contract; they mirror the Payload
//            REST API response shape (depth:1) but are version-stable.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared primitives ─────────────────────────────────────────────────────────

export type ApiProfile = 'public' | 'internal';

export type ServiceStatus = 'active' | 'draft' | 'deprecated' | 'unknown';

export type AccessChannel = 'online' | 'offline' | 'hybrid' | 'unknown';

export type StepType =
  | 'submission'
  | 'verification'
  | 'inspection'
  | 'payment'
  | 'instruction'
  | 'approval'
  | 'decision'
  | 'notification'
  | 'delivery'
  | 'archival'
  | 'other';

export type StepActor = 'citizen' | 'business' | 'administration' | 'mixed' | 'unknown';

// ── Public API Profile ─────────────────────────────────────────────────────────
// Served by procedures-api GET /v1/procedures and GET /v1/procedures/:serviceId.
// Does NOT contain executionMapping or metrics.

export interface ProcedureSummaryDto {
  serviceId: string;
  name: string;
  slug: string;
  type?: string;
  status: ServiceStatus;
  owner: OwnerDto;
  category?: { id: number | string; name: string };
  access: { channel: AccessChannel };
  processingTime?: { slaDays?: number; rawText?: string };
  fee?: FeeSummaryDto;
  url?: string;
}

export interface ProcedureDetailDto extends ProcedureSummaryDto {
  description?: unknown; // Lexical rich text — opaque to consumers
  audience?: string;
  eligibility?: string;
  documentsRequired?: DocumentRequiredDto[];
  workflow?: WorkflowPublicDto;
  supportContact?: SupportContactDto;
  form?: { id: number | string } | null;
}

// ── Internal API Profile ───────────────────────────────────────────────────────
// Served by procedures-api GET /v1/internal/procedures/:serviceId.
// Adds executionMapping and metrics.

export interface ProcedureInternalDto extends ProcedureDetailDto {
  executionMapping?: ExecutionMappingDto;
  metrics?: MetricsDto;
}

// ── Sub-objects ───────────────────────────────────────────────────────────────

export interface OwnerDto {
  ministry: string;
  entity?: string;
  directorate?: string;
  serviceUnit?: string;
}

export interface FeeSummaryDto {
  currency: string;
  model: 'fixed' | 'range' | 'conditional' | 'composite' | 'percentage' | 'unknown';
  rules?: FeeRuleDto[];
  summary?: {
    isConditional: boolean;
    minAmount?: number;
    maxAmount?: number;
    defaultAmount?: number;
    ruleCount: number;
  };
}

export interface FeeRuleDto {
  ruleId: string;
  type: 'fixed' | 'range' | 'percentage' | 'component' | 'unknown';
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  condition?: string;
}

export interface DocumentRequiredDto {
  documentTypeCode: string;
  label: string;
  requirementLevel: 'required' | 'conditional' | 'optional';
  condition?: string;
}

export interface WorkflowPublicDto {
  normalizationConfidence: 'auto_high' | 'auto_medium' | 'manual_required';
  reviewStatus: 'approved_auto' | 'review_required' | 'manual_required';
  steps: WorkflowStepPublicDto[];
}

export interface WorkflowStepPublicDto {
  stepId: string;
  order: number;
  label: string;
  stepType: StepType;
  actor: StepActor;
  channel: AccessChannel;
  requiresPayment: boolean;
  slaDays?: number;
}

export interface SupportContactDto {
  phone?: string;
  email?: string;
  officeAddress?: string;
}

export interface ExecutionMappingDto {
  serviceId: string;
  version: string;
  reviewStatus: 'approved' | 'review_required' | 'manual_required';
  process?: ExecutionProcessDto;
}

export interface ExecutionProcessDto {
  processId: string;
  version: string;
  actor?: StepActor;
  channel?: AccessChannel;
  estimatedDurationDays?: number;
  steps: ExecutionStepDto[];
}

export interface ExecutionStepDto extends WorkflowStepPublicDto {
  responsibleUnit?: string;
  wbbTaskType?: 'UserTask' | 'ServiceTask' | 'Gateway' | 'Event';
  wbbAssigneeRole?: string;
  automatable?: boolean;
  confidence: 'auto_high' | 'auto_medium' | 'manual_required';
}

export interface MetricsDto {
  frictionScore?: number;
  documentsCount?: number;
  manualRequiredShare?: number;
}

// ── Case API DTOs ─────────────────────────────────────────────────────────────

export type CaseStatus =
  | 'submitted'
  | 'under_review'
  | 'pending_documents'
  | 'approved'
  | 'rejected'
  | 'cancelled';

/** Display vocabulary used in citizen-facing UIs (portal). */
export type CaseStatusDisplay =
  | 'pending'
  | 'processing'
  | 'info_required'
  | 'approved'
  | 'rejected';

/**
 * Maps canonical case-api statuses to citizen-facing display labels.
 * Use this instead of maintaining separate status enums in each consumer.
 */
export const CASE_STATUS_TO_DISPLAY: Record<CaseStatus, CaseStatusDisplay> = {
  submitted:          'pending',
  under_review:       'processing',
  pending_documents:  'info_required',
  approved:           'approved',
  rejected:           'rejected',
  cancelled:          'rejected',
};

export interface CreateCaseDto {
  serviceId: string;
  applicantId: string;
  submissionId?: string;
  formData?: Record<string, unknown>;
}

export interface CaseDto {
  id: string;
  serviceId: string;
  applicantId: string;
  submissionId?: string;
  status: CaseStatus;
  currentStepId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCaseStatusDto {
  status: CaseStatus;
  note?: string;
  actorId?: string;
}

// ── Form Definition DTO (served by procedures-api /form) ──────────────────────

export interface FormDefinitionDto {
  id: number | string;
  title: string;
  fields: FormFieldDto[];
  submitButtonLabel?: string;
  confirmationMessage?: string;
}

export interface FormFieldDto {
  id?: string;
  blockType: string;
  label: string;
  name: string;
  required?: boolean;
  width?: number;
  // extended fields (spec: form-definition)
  fieldId?: string;
  mapsToDocumentTypeCode?: string;
  mapsToWorkflowStepId?: string;
}
