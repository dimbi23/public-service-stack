import { Controller, Get, Param, Version } from '@nestjs/common';
import { ProceduresService } from './procedures.service';

@Controller('procedures')
export class ProceduresController {
  constructor(private readonly procedures: ProceduresService) {}

  // GET /v1/procedures
  @Get()
  @Version('1')
  findAll() {
    return this.procedures.findAll('public');
  }

  // GET /v1/procedures/:serviceId
  @Get(':serviceId')
  @Version('1')
  findOne(@Param('serviceId') serviceId: string) {
    return this.procedures.findOne(serviceId, 'public');
  }

  // GET /v1/procedures/:serviceId/form
  @Get(':serviceId/form')
  @Version('1')
  findForm(@Param('serviceId') serviceId: string) {
    return this.procedures.findFormDefinition(serviceId);
  }
}
