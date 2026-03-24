import { Injectable, Logger } from '@nestjs/common';
import { createEvent } from '@org/events';
import type {
  CaseSubmittedPayload,
  CaseStatusChangedPayload,
  CaseStepCompletedPayload,
  CaseDocumentUploadedPayload,
  CaseClosedPayload,
} from '@org/events';

/**
 * EventsService — emits case lifecycle events.
 *
 * Current implementation logs to stdout (development).
 * Production: replace emit() body with a message broker publish call
 * (e.g. NATS, RabbitMQ, Kafka) using the same EventEnvelope<T> structure.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  emitCaseSubmitted(payload: CaseSubmittedPayload): void {
    const event = createEvent('case.submitted', 'case-api', payload);
    this.emit(event);
  }

  emitCaseStatusChanged(payload: CaseStatusChangedPayload): void {
    const event = createEvent('case.status_changed', 'case-api', payload);
    this.emit(event);
  }

  emitCaseStepCompleted(payload: CaseStepCompletedPayload): void {
    const event = createEvent('case.step_completed', 'case-api', payload);
    this.emit(event);
  }

  emitCaseDocumentUploaded(payload: CaseDocumentUploadedPayload): void {
    const event = createEvent('case.document_uploaded', 'case-api', payload);
    this.emit(event);
  }

  emitCaseClosed(payload: CaseClosedPayload): void {
    const event = createEvent('case.closed', 'case-api', payload);
    this.emit(event);
  }

  private emit(event: ReturnType<typeof createEvent>): void {
    // TODO: publish to message broker
    this.logger.log(`[EVENT] ${event.type} — ${JSON.stringify(event.payload)}`);
  }
}
