import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '@org/common';
import type { Redis } from 'ioredis';
import { WorkflowService } from './workflow.service';
import type { CaseSubmittedEvent } from '@org/events';

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisSubscriberService.name);
  private subscriber!: Redis;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly workflowService: WorkflowService,
  ) {}

  onModuleInit() {
    this.subscriber = this.redis.duplicate();
    this.subscriber.subscribe('case_events', (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe: ${err.message}`);
      } else {
        this.logger.log('Subscribed to "case_events" channel');
      }
    });

    this.subscriber.on('message', async (channel, message) => {
      if (channel === 'case_events') {
        try {
          const event = JSON.parse(message) as CaseSubmittedEvent;
          if (event.type === 'case.submitted') {
            this.logger.log(`Received case.submitted for case ${event.payload.caseId}`);
            try {
              await this.workflowService.trigger({
                caseId: event.payload.caseId,
                serviceId: event.payload.serviceId,
                applicantId: event.payload.applicantId,
                submissionId: event.payload.submissionId,
              });
            } catch (triggerErr) {
              this.logger.error(`Failed to trigger workflow for case ${event.payload.caseId}: ${(triggerErr as Error).message}`);
            }
          }
        } catch (err) {
          this.logger.error(`Error processing Redis message: ${(err as Error).message}`);
        }
      }
    });
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.quit();
    }
  }
}
