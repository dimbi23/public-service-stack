import { Injectable, NotFoundException } from '@nestjs/common';
import type { CaseStatus } from '@org/dto';
import { PrismaService } from '../prisma/prisma.service';
import type {
  Case as PrismaCase,
  CaseStep as PrismaCaseStep,
  CaseDocument as PrismaCaseDocument,
} from '../generated/prisma';

// ── Domain model (wire-compatible with what CasesService expects) ──────────────

export interface CaseStep {
  stepId: string;
  stepType: string;
  actor: string;
  outcome: string;
  actorId?: string | null;
  note?: string | null;
  completedAt: string;
}

export interface CaseDocument {
  documentTypeCode: string;
  label: string;
  storageRef: string;
  uploadedAt: string;
}

export interface Case {
  id: string;
  serviceId: string;
  applicantId: string;
  submissionId?: string | null;
  formData?: Record<string, unknown> | null;
  status: CaseStatus;
  currentStepId?: string | null;
  documents: CaseDocument[];
  stepHistory: CaseStep[];
  createdAt: string;
  updatedAt: string;
}

// ── Filter ────────────────────────────────────────────────────────────────────

export interface CaseFilter {
  serviceId?: string;
  applicantId?: string;
  status?: CaseStatus;
  limit?: number;
  offset?: number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function toCase(
  row: PrismaCase & { steps: PrismaCaseStep[]; documents: PrismaCaseDocument[] },
): Case {
  return {
    id: row.id,
    serviceId: row.serviceId,
    applicantId: row.applicantId,
    submissionId: row.submissionId,
    formData: row.formData as Record<string, unknown> | null,
    status: row.status as CaseStatus,
    currentStepId: row.currentStepId,
    stepHistory: row.steps.map((s) => ({
      stepId: s.stepId,
      stepType: s.stepType,
      actor: s.actor,
      outcome: s.outcome,
      actorId: s.actorId,
      note: s.note,
      completedAt: s.completedAt.toISOString(),
    })),
    documents: row.documents.map((d) => ({
      documentTypeCode: d.documentTypeCode,
      label: d.label,
      storageRef: d.storageRef,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const INCLUDE = { steps: true, documents: true } as const;

// ── Repository ────────────────────────────────────────────────────────────────

@Injectable()
export class CasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: {
    id: string;
    serviceId: string;
    applicantId: string;
    submissionId?: string;
    formData?: Record<string, unknown>;
    status: CaseStatus;
  }): Promise<Case> {
    const row = await this.prisma.case.create({
      data: {
        id: data.id,
        serviceId: data.serviceId,
        applicantId: data.applicantId,
        submissionId: data.submissionId,
        formData: data.formData ?? undefined,
        status: data.status,
      },
      include: INCLUDE,
    });
    return toCase(row);
  }

  async findById(id: string): Promise<Case | null> {
    const row = await this.prisma.case.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return row ? toCase(row) : null;
  }

  async findAll(filter: CaseFilter = {}): Promise<{ docs: Case[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (filter.serviceId) where['serviceId'] = filter.serviceId;
    if (filter.applicantId) where['applicantId'] = filter.applicantId;
    if (filter.status) where['status'] = filter.status;

    const skip = filter.offset ?? 0;
    const take = filter.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.prisma.case.count({ where }),
      this.prisma.case.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return { docs: rows.map(toCase), total };
  }

  async updateStatus(id: string, status: CaseStatus, currentStepId?: string): Promise<Case> {
    const row = await this.prisma.case.update({
      where: { id },
      data: {
        status,
        ...(currentStepId !== undefined ? { currentStepId } : {}),
      },
      include: INCLUDE,
    });
    return toCase(row);
  }

  async addStep(caseId: string, step: {
    stepId: string;
    stepType: string;
    actor: string;
    outcome: string;
    actorId?: string;
    note?: string;
    completedAt: string;
  }): Promise<Case> {
    await this.prisma.caseStep.create({
      data: {
        caseId,
        stepId: step.stepId,
        stepType: step.stepType,
        actor: step.actor,
        outcome: step.outcome,
        actorId: step.actorId,
        note: step.note,
        completedAt: new Date(step.completedAt),
      },
    });
    await this.prisma.case.update({
      where: { id: caseId },
      data: { currentStepId: step.stepId },
    });
    const row = await this.prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: INCLUDE,
    });
    return toCase(row);
  }

  async addDocument(caseId: string, doc: {
    documentTypeCode: string;
    label: string;
    storageRef: string;
    uploadedAt: string;
  }): Promise<Case> {
    await this.prisma.caseDocument.create({
      data: {
        caseId,
        documentTypeCode: doc.documentTypeCode,
        label: doc.label,
        storageRef: doc.storageRef,
        uploadedAt: new Date(doc.uploadedAt),
      },
    });
    const row = await this.prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: INCLUDE,
    });
    return toCase(row);
  }

  async findByIdOrThrow(id: string): Promise<Case> {
    const found = await this.findById(id);
    if (!found) throw new NotFoundException(`Case ${id} not found`);
    return found;
  }
}
