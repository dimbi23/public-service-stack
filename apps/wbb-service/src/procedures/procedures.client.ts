import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { ProcedureInternalDto } from '@org/dto';

/**
 * ProceduresClient — calls procedures-api internal profile.
 *
 * Config: PROCEDURES_API_URL (default: http://localhost:3001)
 */
@Injectable()
export class ProceduresClient {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('PROCEDURES_API_URL', 'http://localhost:3001');
  }

  async getProcedureInternal(serviceId: string): Promise<ProcedureInternalDto> {
    const { data } = await firstValueFrom(
      this.http.get<ProcedureInternalDto>(
        `${this.baseUrl}/v1/internal/procedures/${serviceId}`,
      ),
    );
    return data;
  }
}
