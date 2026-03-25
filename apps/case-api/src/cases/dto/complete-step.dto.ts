import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CompleteStepDto {
  @IsEnum(['approved', 'rejected', 'forwarded', 'completed'])
  outcome!: 'approved' | 'rejected' | 'forwarded' | 'completed';

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}
