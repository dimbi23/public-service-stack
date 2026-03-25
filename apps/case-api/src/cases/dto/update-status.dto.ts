import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { CaseStatus } from '@org/dto';

const CASE_STATUSES: CaseStatus[] = ['submitted', 'under_review', 'pending_documents', 'approved', 'rejected', 'cancelled'];

export class UpdateStatusDto {
  @IsEnum(CASE_STATUSES)
  status!: CaseStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}
