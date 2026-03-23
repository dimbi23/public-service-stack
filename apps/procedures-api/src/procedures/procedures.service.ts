import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export type ApiProfile = 'public' | 'internal';

// Fields stripped from the public profile (spec: execution-mapping MUST NOT
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

    const docs = data?.docs ?? [];
    return docs.map((doc: Record<string, unknown>) => this.applyProfile(doc, profile));
  }

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

    const doc = data?.docs?.[0];
    if (!doc) throw new NotFoundException(`Procedure ${serviceId} not found`);

    return this.applyProfile(doc, profile);
  }

  async findFormDefinition(serviceId: string) {
    // Resolve the service first to get the linked form id
    const procedure = await this.findOne(serviceId, 'public');
    const formId = typeof procedure.form === 'object' && procedure.form !== null
      ? (procedure.form as Record<string, unknown>)['id']
      : procedure.form;

    if (!formId) throw new NotFoundException(`No form linked to procedure ${serviceId}`);

    const { data } = await firstValueFrom(
      this.http.get(`${this.payloadUrl}/api/forms/${formId}`, {
        params: { depth: 1 },
      }),
    );

    return data;
  }

  private applyProfile(doc: Record<string, unknown>, profile: ApiProfile) {
    if (profile === 'internal') return doc;

    const filtered = { ...doc };
    for (const field of INTERNAL_ONLY_FIELDS) {
      delete filtered[field];
    }
    return filtered;
  }
}
