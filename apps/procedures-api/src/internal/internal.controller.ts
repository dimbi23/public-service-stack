import { Controller, Get, Param, Version } from '@nestjs/common';
import { ProceduresService } from '../procedures/procedures.service';

// Internal profile — serves all fields including execution-mapping.
// MUST NOT be exposed publicly. Consumed by case-api and wbb-service only.
@Controller('internal/procedures')
export class InternalController {
  constructor(private readonly procedures: ProceduresService) {}

  // GET /v1/internal/procedures
  @Get()
  @Version('1')
  findAll() {
    return this.procedures.findAll('internal');
  }

  // GET /v1/internal/procedures/:serviceId
  @Get(':serviceId')
  @Version('1')
  findOne(@Param('serviceId') serviceId: string) {
    return this.procedures.findOne(serviceId, 'internal');
  }
}
