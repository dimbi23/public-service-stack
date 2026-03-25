import { IsString } from 'class-validator';

export class AddDocumentDto {
  @IsString()
  documentTypeCode!: string;

  @IsString()
  label!: string;

  @IsString()
  storageRef!: string;
}
