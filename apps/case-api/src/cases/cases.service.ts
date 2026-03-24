import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type { CaseStatus } from '@org/dto';
import { EventsService } from '../events/events.service';
import type { AddDocumentDto } from './dto/add-document.dto';
import type { CompleteStepDto } from './dto/complete-step.dto';
import type { CreateCaseDto } from './dto/create-case.dto';
import type { UpdateStatusDto } from './dto/update-status.dto';
import { CasesRepository } from './cases.repository';
import type { Case } from './cases.repository';

// ── Allowed status transitions ────────────────────────────────────────────────

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  submitted:          ['under_review', 'cancelled'],
  under_review:       ['pending_documents', 'approved', 'rejected'],
  pending_documents:  ['under_review', 'cancelled'],
  approved:           [],
  rejected:           [],
  cancelled:          [],
};

@Injectable()
export class CasesService {
  constructor(
    private readonly repo: CasesRepository,
    private readonly events: EventsService,
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(dto: CreateCaseDto): Promise<Case> {
    const newCase = await this.repo.save({
      id: crypto.randomUUID(),
      serviceId: dto.serviceId,
      applicantId: dto.applicantId,
      submissionId: dto.submissionId,
      formData: dto.formData,
      status: 'submitted',
    });

    this.events.emitCaseSubmitted({
      caseId: newCase.id,
      serviceId: newCase.serviceId,
      applicantId: newCase.applicantId,
      submissionId: newCase.submissionId ?? undefined,
    });

    return newCase;
  }

  // ── Find ────────────────────────────────────────────────────────────────────

  async findAll(filter: {
    serviceId?: string;
    applicantId?: string;
    status?: CaseStatus;
    limit?: number;
    offset?: number;
  }) {
    return this.repo.findAll(filter);
  }

  async findOne(id: string): Promise<Case> {
    return this.repo.findByIdOrThrow(id);
  }

  // ── Update status ───────────────────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateStatusDto): Promise<Case> {
    const found = await this.repo.findByIdOrThrow(id);

    const allowed = TRANSITIONS[found.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition ${found.status} → ${dto.status} is not allowed. ` +
        `Allowed next states: [${allowed.join(', ')}]`,
      );
    }

    const updated = await this.repo.updateStatus(id, dto.status);

    this.events.emitCaseStatusChanged({
      caseId: id,
      serviceId: found.serviceId,
      previousStatus: found.status,
      newStatus: dto.status,
      actorId: dto.actorId,
      note: dto.note,
    });

    if (dto.status === 'approved' || dto.status === 'rejected' || dto.status === 'cancelled') {
      this.events.emitCaseClosed({
        caseId: id,
        serviceId: found.serviceId,
        finalStatus: dto.status,
        closedAt: new Date().toISOString(),
      });
    }

    return updated;
  }

  // ── Complete a step ─────────────────────────────────────────────────────────

  async completeStep(caseId: string, stepId: string, dto: CompleteStepDto): Promise<Case> {
    const found = await this.repo.findByIdOrThrow(caseId);

    const completedAt = new Date().toISOString();
    const updated = await this.repo.addStep(caseId, {
      stepId,
      stepType: 'unknown',
      actor: dto.actorId ?? 'unknown',
      outcome: dto.outcome,
      actorId: dto.actorId,
      note: dto.note,
      completedAt,
    });

    this.events.emitCaseStepCompleted({
      caseId,
      serviceId: found.serviceId,
      stepId,
      stepType: 'other',
      actor: 'administration',
      completedAt,
      outcome: dto.outcome,
      note: dto.note,
    });

    return updated;
  }

  // ── Add document ────────────────────────────────────────────────────────────

  async addDocument(caseId: string, dto: AddDocumentDto): Promise<Case> {
    const found = await this.repo.findByIdOrThrow(caseId);

    const uploadedAt = new Date().toISOString();
    const updated = await this.repo.addDocument(caseId, {
      documentTypeCode: dto.documentTypeCode,
      label: dto.label,
      storageRef: dto.storageRef,
      uploadedAt,
    });

    this.events.emitCaseDocumentUploaded({
      caseId,
      serviceId: found.serviceId,
      documentTypeCode: dto.documentTypeCode,
      label: dto.label,
      uploadedAt,
      storageRef: dto.storageRef,
    });

    return updated;
  }
}
