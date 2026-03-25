import { IsOptional, IsString } from 'class-validator';

export class AddDocumentDto {
  @IsString()
  documentTypeCode!: string;

  @IsString()
  label!: string;

  /** Required when uploading via JSON body; omit when sending a file via multipart */
  @IsOptional()
  @IsString()
  storageRef?: string;
}
