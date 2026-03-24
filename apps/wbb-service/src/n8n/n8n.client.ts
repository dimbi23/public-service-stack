import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  N8nWorkflow,
  N8nWorkflowList,
  N8nExecution,
  N8nWebhookPayload,
} from './n8n.types';

/**
 * N8nClient — thin wrapper over n8n's REST API v1 and webhook endpoints.
 *
 * Config env vars:
 *   N8N_BASE_URL   default: http://localhost:5678
 *   N8N_API_KEY    required for REST API calls
 */
@Injectable()
export class N8nClient {
  private readonly logger = new Logger(N8nClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('N8N_BASE_URL', 'http://localhost:5678');
    this.apiKey = this.config.get<string>('N8N_API_KEY', '');
  }

  // ── REST API ──────────────────────────────────────────────────────────────

  private get headers() {
    return { 'X-N8N-API-KEY': this.apiKey };
  }

  async listWorkflows(): Promise<N8nWorkflow[]> {
    const { data } = await firstValueFrom(
      this.http.get<N8nWorkflowList>(`${this.baseUrl}/api/v1/workflows`, {
        headers: this.headers,
        params: { active: true, limit: 250 },
      }),
    );
    return data.data;
  }

  async getWorkflow(id: string): Promise<N8nWorkflow> {
    const { data } = await firstValueFrom(
      this.http.get<N8nWorkflow>(`${this.baseUrl}/api/v1/workflows/${id}`, {
        headers: this.headers,
      }),
    );
    return data;
  }

  async getExecution(id: string): Promise<N8nExecution> {
    const { data } = await firstValueFrom(
      this.http.get<N8nExecution>(`${this.baseUrl}/api/v1/executions/${id}`, {
        headers: this.headers,
      }),
    );
    return data;
  }

  // ── Webhook trigger ───────────────────────────────────────────────────────

  /**
   * Triggers an n8n workflow via its Webhook trigger node.
   *
   * @param webhookPath  Path configured in the n8n Webhook node (e.g. "case-submitted")
   * @param payload      Data forwarded to the workflow
   * @returns The raw n8n response (varies by workflow config)
   */
  async triggerWebhook(
    webhookPath: string,
    payload: N8nWebhookPayload,
  ): Promise<unknown> {
    this.logger.log(`Triggering n8n webhook /${webhookPath} for case ${payload.caseId}`);

    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/webhook/${webhookPath}`,
        payload,
      ),
    );
    return data;
  }

  /**
   * Checks whether n8n is reachable.
   * Used by health checks and startup validation.
   */
  async ping(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.get(`${this.baseUrl}/healthz`),
      );
      return true;
    } catch {
      return false;
    }
  }
}
