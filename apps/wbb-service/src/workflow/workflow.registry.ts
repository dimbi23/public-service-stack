import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface WorkflowRegistration {
  /** Exact serviceId or glob pattern, e.g. "MAM-*" */
  serviceIdPattern: string;
  /** n8n webhook path for the "case submitted" trigger */
  webhookPath: string;
  /** Human-readable workflow name (for logs) */
  workflowName?: string;
  /** n8n workflow ID (for status queries via REST API) */
  n8nWorkflowId?: string;
  registeredAt: string;
}

const REDIS_KEY = 'wbb:workflow-registrations';

@Injectable()
export class WorkflowRegistry implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkflowRegistry.name);
  private redis: Redis;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis(url, { lazyConnect: true });
    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
    await this.redis.connect().catch((err) => {
      this.logger.warn(`Redis connect failed (registry will be in-memory only): ${err.message}`);
    });
    const count = await this.redis.hlen(REDIS_KEY).catch(() => 0);
    this.logger.log(`WorkflowRegistry loaded — ${count} registration(s) from Redis`);
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async register(reg: Omit<WorkflowRegistration, 'registeredAt'>): Promise<WorkflowRegistration> {
    const full: WorkflowRegistration = { ...reg, registeredAt: new Date().toISOString() };
    await this.redis.hset(REDIS_KEY, reg.serviceIdPattern, JSON.stringify(full));
    this.logger.log(
      `Registered workflow "${reg.workflowName ?? reg.webhookPath}" for pattern "${reg.serviceIdPattern}"`,
    );
    return full;
  }

  async unregister(serviceIdPattern: string): Promise<void> {
    await this.redis.hdel(REDIS_KEY, serviceIdPattern);
  }

  async resolve(serviceId: string): Promise<WorkflowRegistration | undefined> {
    const all = await this.redis.hgetall(REDIS_KEY).catch(() => ({} as Record<string, string>));

    // Exact match first
    if (all[serviceId]) {
      return JSON.parse(all[serviceId]) as WorkflowRegistration;
    }

    // Wildcard — "MAM-*" matches "MAM-CENAM-B-P1"
    for (const [pattern, raw] of Object.entries(all)) {
      if (pattern.endsWith('*') && serviceId.startsWith(pattern.slice(0, -1))) {
        return JSON.parse(raw) as WorkflowRegistration;
      }
    }

    return undefined;
  }

  async resolveOrThrow(serviceId: string): Promise<WorkflowRegistration> {
    const reg = await this.resolve(serviceId);
    if (!reg) {
      throw new NotFoundException(
        `No workflow registered for serviceId "${serviceId}". ` +
          `Register one via POST /v1/workflow/register`,
      );
    }
    return reg;
  }

  async listAll(): Promise<WorkflowRegistration[]> {
    const all = await this.redis.hgetall(REDIS_KEY).catch(() => ({} as Record<string, string>));
    return Object.values(all).map((raw) => JSON.parse(raw) as WorkflowRegistration);
  }
}
