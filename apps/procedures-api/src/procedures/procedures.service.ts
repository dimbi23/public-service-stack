import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export type ApiProfile = 'public' | 'internal';

// Fields stripped from the public profile (spec: executionMapping MUST NOT
// be served in the Public API Profile)
const INTERNAL_ONLY_FIELDS = ['executionMapping', 'metrics'];

@Injectable()
export class ProceduresService {
  private readonly payloadUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.payloadUrl = this.config.get<string>('PAYLOAD_API_URL', 'http://localhost:3000');
  }

  // ── Public list ────────────────────────────────────────────────────────────

  async findAll(profile: ApiProfile = 'public') {
    const { data } = await firstValueFrom(
      this.http.get(`${this.payloadUrl}/api/services`, {
        params: {
          'where[status][equals]': 'active',
          limit: 100,
          depth: 1,
        },
      }),
    );

    const docs: Record<string, unknown>[] = data?.docs ?? [];

    if (profile === 'public') {
      return docs.map((doc) => this.stripInternal(doc));
    }

    // Internal: enrich each doc with its ExecutionMapping
    return Promise.all(
      docs.map((doc) => this.enrichWithExecutionMapping(doc)),
    );
  }

  // ── Single procedure ───────────────────────────────────────────────────────

  async findOne(serviceId: string, profile: ApiProfile = 'public') {
    const { data } = await firstValueFrom(
      this.http.get(`${this.payloadUrl}/api/services`, {
        params: {
          'where[serviceId][equals]': serviceId,
          limit: 1,
          depth: 1,
        },
      }),
    );

    const doc: Record<string, unknown> | undefined = data?.docs?.[0];
    if (!doc) throw new NotFoundException(`Procedure ${serviceId} not found`);

    if (profile === 'public') return this.stripInternal(doc);

    return this.enrichWithExecutionMapping(doc);
  }

  // ── Form definition ────────────────────────────────────────────────────────

  async findFormDefinition(serviceId: string) {
    const procedure = await this.findOne(serviceId, 'public');
    const formId =
      typeof procedure['form'] === 'object' && procedure['form'] !== null
        ? (procedure['form'] as Record<string, unknown>)['id']
        : procedure['form'];

    if (!formId) throw new NotFoundException(`No form linked to procedure ${serviceId}`);

    const { data } = await firstValueFrom(
      this.http.get(`${this.payloadUrl}/api/forms/${formId}`, {
        params: { depth: 1 },
      }),
    );

    return data;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private stripInternal(doc: Record<string, unknown>): Record<string, unknown> {
    const filtered = { ...doc };
    for (const field of INTERNAL_ONLY_FIELDS) {
      delete filtered[field];
    }
    return filtered;
  }

  /**
   * Fetch the ExecutionMapping for this service from Payload and attach it
   * as `executionMapping` on the doc. Best-effort: if none exists, the field
   * is left undefined (wbb-service already handles this gracefully).
   */
  private async enrichWithExecutionMapping(
    doc: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const serviceId = doc['serviceId'] as string | undefined;
    if (!serviceId) return doc;

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.payloadUrl}/api/execution-mappings`, {
          params: {
            'where[serviceId][equals]': serviceId,
            limit: 1,
            depth: 1,
          },
        }),
      );

      const mapping: Record<string, unknown> | undefined = data?.docs?.[0];
      if (!mapping) return doc;

      return {
        ...doc,
        executionMapping: {
          reviewStatus: mapping['reviewStatus'],
          normalizationConfidence: mapping['normalizationConfidence'],
          process: mapping['process'],
        },
      };
    } catch {
      // Payload may not have an ExecutionMapping for every service — non-fatal
      return doc;
    }
  }
}
