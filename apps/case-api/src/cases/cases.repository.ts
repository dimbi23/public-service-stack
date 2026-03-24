import { Injectable } from '@nestjs/common';
import type { CaseStatus } from '@org/dto';

// ── Domain model ──────────────────────────────────────────────────────────────

export interface CaseDocument {
  documentTypeCode: string;
  label: string;
  storageRef: string;
  uploadedAt: string;
}

export interface CaseStep {
  stepId: string;
  stepType: string;
  actor: string;
  outcome: 'approved' | 'rejected' | 'forwarded' | 'completed';
  actorId?: string;
  note?: string;
  completedAt: string;
}

export interface Case {
  id: string;
  serviceId: string;
  applicantId: string;
  submissionId?: string;
  formData?: Record<string, unknown>;
  status: CaseStatus;
  currentStepId?: string;
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

// ── Repository ────────────────────────────────────────────────────────────────

/**
 * In-memory case store.
 *
 * TODO: replace with a TypeORM / Prisma repository backed by PostgreSQL.
 *       The interface surface (save, findById, findAll, update) maps 1-to-1
 *       to standard ORM operations — the service layer does not need to change.
 */
@Injectable()
export class CasesRepository {
  private readonly store = new Map<string, Case>();

  save(caseRecord: Case): Case {
    this.store.set(caseRecord.id, caseRecord);
    return caseRecord;
  }

  findById(id: string): Case | undefined {
    return this.store.get(id);
  }

  findAll(filter: CaseFilter = {}): { docs: Case[]; total: number } {
    let docs = Array.from(this.store.values());

    if (filter.serviceId) docs = docs.filter((c) => c.serviceId === filter.serviceId);
    if (filter.applicantId) docs = docs.filter((c) => c.applicantId === filter.applicantId);
    if (filter.status) docs = docs.filter((c) => c.status === filter.status);

    docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = docs.length;
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 20;
    return { docs: docs.slice(offset, offset + limit), total };
  }

  update(id: string, patch: Partial<Omit<Case, 'id'>>): Case | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated: Case = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}
