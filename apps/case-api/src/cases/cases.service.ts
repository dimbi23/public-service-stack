import {
  BadRequestException,
  Injectable,
  NotFoundException,
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

  create(dto: CreateCaseDto): Case {
    const now = new Date().toISOString();
    const newCase: Case = {
      id: crypto.randomUUID(),
      serviceId: dto.serviceId,
      applicantId: dto.applicantId,
      submissionId: dto.submissionId,
      formData: dto.formData,
      status: 'submitted',
      documents: [],
      stepHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    this.repo.save(newCase);

    this.events.emitCaseSubmitted({
      caseId: newCase.id,
      serviceId: newCase.serviceId,
      applicantId: newCase.applicantId,
      submissionId: newCase.submissionId,
    });

    return newCase;
  }

  // ── Find ────────────────────────────────────────────────────────────────────

  findAll(filter: {
    serviceId?: string;
    applicantId?: string;
    status?: CaseStatus;
    limit?: number;
    offset?: number;
  }) {
    return this.repo.findAll(filter);
  }

  findOne(id: string): Case {
    const found = this.repo.findById(id);
    if (!found) throw new NotFoundException(`Case ${id} not found`);
    return found;
  }

  // ── Update status ───────────────────────────────────────────────────────────

  updateStatus(id: string, dto: UpdateStatusDto): Case {
    const found = this.findOne(id);

    const allowed = TRANSITIONS[found.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition ${found.status} → ${dto.status} is not allowed. ` +
        `Allowed next states: [${allowed.join(', ')}]`,
      );
    }

    const updated = this.repo.update(id, { status: dto.status });

    this.events.emitCaseStatusChanged({
      caseId: id,
      serviceId: found.serviceId,
      previousStatus: found.status,
      newStatus: dto.status,
      actorId: dto.actorId,
      note: dto.note,
    });

    // Emit case.closed for terminal states
    if (dto.status === 'approved' || dto.status === 'rejected' || dto.status === 'cancelled') {
      this.events.emitCaseClosed({
        caseId: id,
        serviceId: found.serviceId,
        finalStatus: dto.status,
        closedAt: new Date().toISOString(),
      });
    }

    return updated!;
  }

  // ── Complete a step ─────────────────────────────────────────────────────────

  completeStep(caseId: string, stepId: string, dto: CompleteStepDto): Case {
    const found = this.findOne(caseId);

    const stepEntry = {
      stepId,
      stepType: 'unknown',
      actor: dto.actorId ?? 'unknown',
      outcome: dto.outcome,
      actorId: dto.actorId,
      note: dto.note,
      completedAt: new Date().toISOString(),
    };

    const updated = this.repo.update(caseId, {
      currentStepId: stepId,
      stepHistory: [...found.stepHistory, stepEntry],
    });

    this.events.emitCaseStepCompleted({
      caseId,
      serviceId: found.serviceId,
      stepId,
      stepType: 'other',
      actor: 'administration',
      completedAt: stepEntry.completedAt,
      outcome: dto.outcome,
      note: dto.note,
    });

    return updated!;
  }

  // ── Add document ────────────────────────────────────────────────────────────

  addDocument(caseId: string, dto: AddDocumentDto): Case {
    const found = this.findOne(caseId);

    const doc = {
      documentTypeCode: dto.documentTypeCode,
      label: dto.label,
      storageRef: dto.storageRef,
      uploadedAt: new Date().toISOString(),
    };

    const updated = this.repo.update(caseId, {
      documents: [...found.documents, doc],
    });

    this.events.emitCaseDocumentUploaded({
      caseId,
      serviceId: found.serviceId,
      documentTypeCode: dto.documentTypeCode,
      label: dto.label,
      uploadedAt: doc.uploadedAt,
      storageRef: dto.storageRef,
    });

    return updated!;
  }
}
