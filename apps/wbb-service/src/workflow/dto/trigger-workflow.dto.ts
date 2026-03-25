import { IsOptional, IsString } from 'class-validator';

export class TriggerWorkflowDto {
  @IsString()
  caseId!: string;

  @IsString()
  serviceId!: string;

  @IsString()
  applicantId!: string;

  @IsOptional()
  @IsString()
  submissionId?: string;
}
