import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  serviceId!: string;

  @IsString()
  applicantId!: string;

  @IsOptional()
  @IsString()
  submissionId?: string;

  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;
}
