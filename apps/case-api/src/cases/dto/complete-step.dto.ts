export class CompleteStepDto {
  outcome!: 'approved' | 'rejected' | 'forwarded' | 'completed';
  note?: string;
  actorId?: string;
}
