import { IsEnum, IsOptional, IsString } from 'class-validator';

export class WorkflowCallbackDto {
  @IsString()
  caseId!: string;

  @IsString()
  stepId!: string;

  @IsEnum(['approved', 'rejected', 'forwarded', 'completed'])
  outcome!: 'approved' | 'rejected' | 'forwarded' | 'completed';

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  /** If set, wbb-service will trigger the next step automatically */
  @IsOptional()
  @IsString()
  nextStepId?: string;

  @IsOptional()
  @IsString()
  executionId?: string;
}
