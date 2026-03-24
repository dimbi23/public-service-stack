export class CreateCaseDto {
  serviceId!: string;
  applicantId!: string;
  submissionId?: string;
  formData?: Record<string, unknown>;
}
