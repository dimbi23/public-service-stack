// ─────────────────────────────────────────────────────────────────────────────
// @org/events — async event contracts for the inter-service message bus
//
// Used by: case-api (producer), wbb-service (consumer), procedures-api (consumer)
// Transport: any message broker — envelope is broker-agnostic.
// ─────────────────────────────────────────────────────────────────────────────

import type { CaseStatus, StepType, StepActor } from '@org/dto';

// ── Event envelope ────────────────────────────────────────────────────────────

export interface EventEnvelope<T = unknown> {
  /** Dot-namespaced event type — e.g. "case.submitted" */
  type: EventType;
  /** ISO-8601 timestamp */
  occurredAt: string;
  /** Idempotency key — deduplicate on the consumer side */
  eventId: string;
  /** Source service that emitted the event */
  source: 'case-api' | 'wbb-service' | 'portal' | 'procedures-api';
  payload: T;
}

// ── Event type registry ───────────────────────────────────────────────────────

export type EventType =
  | 'case.submitted'
  | 'case.status_changed'
  | 'case.step_completed'
  | 'case.document_uploaded'
  | 'case.closed'
  | 'procedure.published'
  | 'procedure.deprecated'
  | 'execution_mapping.updated';

// ── Case events ───────────────────────────────────────────────────────────────

export interface CaseSubmittedPayload {
  caseId: string;
  serviceId: string;
  applicantId: string;
  submissionId?: string;
  /** Full execution mapping at time of submission (snapshot) */
  executionProcessId?: string;
}

export interface CaseStatusChangedPayload {
  caseId: string;
  serviceId: string;
  previousStatus: CaseStatus;
  newStatus: CaseStatus;
  actorId?: string;
  note?: string;
}

export interface CaseStepCompletedPayload {
  caseId: string;
  serviceId: string;
  stepId: string;
  stepType: StepType;
  actor: StepActor;
  completedAt: string;
  outcome: 'approved' | 'rejected' | 'forwarded' | 'completed';
  note?: string;
}

export interface CaseDocumentUploadedPayload {
  caseId: string;
  serviceId: string;
  documentTypeCode: string;
  label: string;
  uploadedAt: string;
  /** Storage path / URL — resolved by portal media collection */
  storageRef: string;
}

export interface CaseClosedPayload {
  caseId: string;
  serviceId: string;
  finalStatus: Extract<CaseStatus, 'approved' | 'rejected' | 'cancelled'>;
  closedAt: string;
}

// ── Procedure events ──────────────────────────────────────────────────────────

export interface ProcedurePublishedPayload {
  serviceId: string;
  name: string;
  version?: string;
  publishedAt: string;
}

export interface ProcedureDeprecatedPayload {
  serviceId: string;
  deprecatedAt: string;
  replacedBy?: string;
}

export interface ExecutionMappingUpdatedPayload {
  serviceId: string;
  version: string;
  reviewStatus: 'approved' | 'review_required' | 'manual_required';
  updatedAt: string;
}

// ── Typed envelope helpers ────────────────────────────────────────────────────

export type CaseSubmittedEvent = EventEnvelope<CaseSubmittedPayload>;
export type CaseStatusChangedEvent = EventEnvelope<CaseStatusChangedPayload>;
export type CaseStepCompletedEvent = EventEnvelope<CaseStepCompletedPayload>;
export type CaseDocumentUploadedEvent = EventEnvelope<CaseDocumentUploadedPayload>;
export type CaseClosedEvent = EventEnvelope<CaseClosedPayload>;
export type ProcedurePublishedEvent = EventEnvelope<ProcedurePublishedPayload>;
export type ProcedureDeprecatedEvent = EventEnvelope<ProcedureDeprecatedPayload>;
export type ExecutionMappingUpdatedEvent = EventEnvelope<ExecutionMappingUpdatedPayload>;

/** Union of all typed events — use for discriminated union switches */
export type AnyEvent =
  | CaseSubmittedEvent
  | CaseStatusChangedEvent
  | CaseStepCompletedEvent
  | CaseDocumentUploadedEvent
  | CaseClosedEvent
  | ProcedurePublishedEvent
  | ProcedureDeprecatedEvent
  | ExecutionMappingUpdatedEvent;

// ── Factory helper ────────────────────────────────────────────────────────────

export function createEvent<T>(
  type: EventType,
  source: EventEnvelope['source'],
  payload: T,
): EventEnvelope<T> {
  return {
    type,
    occurredAt: new Date().toISOString(),
    eventId: crypto.randomUUID(),
    source,
    payload,
  };
}
