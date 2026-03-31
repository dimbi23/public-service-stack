import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createEvent } from '@org/events';
import type {
  CaseSubmittedPayload,
  CaseStatusChangedPayload,
  CaseStepCompletedPayload,
  CaseDocumentUploadedPayload,
  CaseClosedPayload,
} from '@org/events';

/**
 * EventsService — emits case lifecycle events via Redis pub/sub.
 *
 * Channel convention: events:<event-type>
 * e.g. events:case.submitted, events:case.status_changed
 *
 * Consumers (wbb-service, portal) can subscribe to these channels.
 */
@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private redis: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(url, { lazyConnect: true });
    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
    this.redis.connect().catch((err) => {
      this.logger.warn(`Redis connect failed (events will log only): ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

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
    const channel = `events:${event.type}`;
    const message = JSON.stringify(event);

    this.logger.log(`[EVENT] ${event.type} — ${JSON.stringify(event.payload)}`);

    if (this.redis?.status === 'ready') {
      this.redis.publish(channel, message).catch((err) => {
        this.logger.error(`Failed to publish event ${event.type}: ${err.message}`);
      });
    }
  }
}
