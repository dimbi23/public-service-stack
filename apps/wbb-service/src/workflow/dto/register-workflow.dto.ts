import { IsOptional, IsString } from 'class-validator';

export class RegisterWorkflowDto {
  /** Exact serviceId or glob pattern, e.g. "MAM-*" */
  @IsString()
  serviceIdPattern!: string;

  /** Path of the Webhook trigger node in n8n, e.g. "case-submitted" */
  @IsString()
  webhookPath!: string;

  @IsOptional()
  @IsString()
  workflowName?: string;

  @IsOptional()
  @IsString()
  n8nWorkflowId?: string;
}
