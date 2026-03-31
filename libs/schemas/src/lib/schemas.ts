/**
 * @org/schemas — canonical constants and type guards for the
 * administrative-process-schema standard (BR-001–BR-013).
 *
 * Document types, step types, access channels, fee models, and
 * requirement levels used across procedures-api, case-api, wbb-service,
 * and the normalizer pipeline.
 */

// ── Document type codes (BR-007) ─────────────────────────────────────────────

export const DOCUMENT_TYPE_CODES = [
  'DOC_ID_CIN',
  'DOC_ID_PASSPORT',
  'DOC_ID_PHOTO',
  'DOC_CIV_BIRTH',
  'DOC_RES_CERT',
  'DOC_EDU_TRANSCRIPT',
  'DOC_EDU_CERT_SUCCESS',
  'DOC_EDU_RESEARCH_MEMOIR',
  'DOC_HEALTH_MED_FORM',
  'DOC_TECH_ANALYSIS_REPORT',
  'DOC_AUTH_INTRO_LETTER',
  'DOC_REQ_APPLICATION_LETTER',
  'DOC_REQ_APPLICATION_FORM',
  'DOC_PAY_BANK_SLIP',
  'DOC_PAY_INVOICE',
  'DOC_VEH_REG_CARD',
  'DOC_SUP_ENVELOPE_A3',
  'DOC_SUP_STAMP',
  'DOC_SUP_FOLDING_FILE',
] as const;

export type DocumentTypeCode = (typeof DOCUMENT_TYPE_CODES)[number];

export function isDocumentTypeCode(value: unknown): value is DocumentTypeCode {
  return DOCUMENT_TYPE_CODES.includes(value as DocumentTypeCode);
}

// ── Step types (BR-008) ───────────────────────────────────────────────────────

export const STEP_TYPES = [
  'submission',
  'verification',
  'inspection',
  'payment',
  'instruction',
  'approval',
  'decision',
  'notification',
  'delivery',
  'archival',
  'other',
] as const;

export type StepType = (typeof STEP_TYPES)[number];

// ── Actor types (BR-009) ──────────────────────────────────────────────────────

export const ACTOR_TYPES = [
  'citizen',
  'business',
  'administration',
  'mixed',
  'unknown',
] as const;

export type ActorType = (typeof ACTOR_TYPES)[number];

// ── Access channels (BR-003) ──────────────────────────────────────────────────

export const ACCESS_CHANNELS = ['online', 'offline', 'hybrid', 'unknown'] as const;

export type AccessChannel = (typeof ACCESS_CHANNELS)[number];

// ── Fee models (BR-005) ───────────────────────────────────────────────────────

export const FEE_MODELS = [
  'fixed',
  'range',
  'conditional',
  'composite',
  'percentage',
  'unknown',
] as const;

export type FeeModel = (typeof FEE_MODELS)[number];

// ── Requirement levels (BR-007) ───────────────────────────────────────────────

export const REQUIREMENT_LEVELS = ['required', 'conditional', 'optional'] as const;

export type RequirementLevel = (typeof REQUIREMENT_LEVELS)[number];

// ── Service status ────────────────────────────────────────────────────────────

export const SERVICE_STATUSES = ['active', 'draft', 'deprecated', 'unknown'] as const;

export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

// ── Normalization confidence (BR-012) ─────────────────────────────────────────

export const CONFIDENCE_LEVELS = ['auto_high', 'auto_medium', 'manual_required'] as const;

export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// ── WBB task types (GovStack WBB spec) ───────────────────────────────────────

export const WBB_TASK_TYPES = ['UserTask', 'ServiceTask', 'Gateway', 'Event'] as const;

export type WbbTaskType = (typeof WBB_TASK_TYPES)[number];
