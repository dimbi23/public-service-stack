import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import type { CaseStatus } from '@org/dto';
import { AddDocumentDto } from './dto/add-document.dto';
import { CompleteStepDto } from './dto/complete-step.dto';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CasesService } from './cases.service';

@Controller('cases')
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  // POST /v1/cases
  @Post()
  @Version('1')
  create(@Body() dto: CreateCaseDto) {
    return this.cases.create(dto);
  }

  // GET /v1/cases?serviceId=&applicantId=&status=&limit=&offset=
  @Get()
  @Version('1')
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('applicantId') applicantId?: string,
    @Query('status') status?: CaseStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.cases.findAll({
      serviceId,
      applicantId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // GET /v1/cases/:id
  @Get(':id')
  @Version('1')
  findOne(@Param('id') id: string) {
    return this.cases.findOne(id);
  }

  // PATCH /v1/cases/:id/status
  @Patch(':id/status')
  @Version('1')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.cases.updateStatus(id, dto);
  }

  // POST /v1/cases/:id/documents
  @Post(':id/documents')
  @Version('1')
  addDocument(@Param('id') id: string, @Body() dto: AddDocumentDto) {
    return this.cases.addDocument(id, dto);
  }

  // GET /v1/cases/:id/documents
  @Get(':id/documents')
  @Version('1')
  async getDocuments(@Param('id') id: string) {
    const c = await this.cases.findOne(id);
    return c.documents;
  }

  // GET /v1/cases/:id/steps
  @Get(':id/steps')
  @Version('1')
  async getSteps(@Param('id') id: string) {
    const c = await this.cases.findOne(id);
    return c.stepHistory;
  }

  // PATCH /v1/cases/:id/steps/:stepId/complete
  @Patch(':id/steps/:stepId/complete')
  @Version('1')
  completeStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: CompleteStepDto,
  ) {
    return this.cases.completeStep(id, stepId, dto);
  }
}
