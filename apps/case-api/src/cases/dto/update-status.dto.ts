import type { CaseStatus } from '@org/dto';

export class UpdateStatusDto {
  status!: CaseStatus;
  note?: string;
  actorId?: string;
}
