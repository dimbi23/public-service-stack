import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { CaseDto, UpdateCaseStatusDto } from '@org/dto';

/**
 * CasesClient — calls case-api on behalf of wbb-service.
 *
 * Config: CASE_API_URL (default: http://localhost:3002)
 */
@Injectable()
export class CasesClient {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('CASE_API_URL', 'http://localhost:3002');
  }

  async getCase(caseId: string): Promise<CaseDto> {
    const { data } = await firstValueFrom(
      this.http.get<CaseDto>(`${this.baseUrl}/v1/cases/${caseId}`),
    );
    return data;
  }

  async completeStep(
    caseId: string,
    stepId: string,
    outcome: 'approved' | 'rejected' | 'forwarded' | 'completed',
    actorId?: string,
    note?: string,
  ): Promise<CaseDto> {
    const { data } = await firstValueFrom(
      this.http.patch<CaseDto>(
        `${this.baseUrl}/v1/cases/${caseId}/steps/${stepId}/complete`,
        { outcome, actorId, note },
      ),
    );
    return data;
  }

  async updateStatus(caseId: string, dto: UpdateCaseStatusDto): Promise<CaseDto> {
    const { data } = await firstValueFrom(
      this.http.patch<CaseDto>(
        `${this.baseUrl}/v1/cases/${caseId}/status`,
        dto,
      ),
    );
    return data;
  }
}
