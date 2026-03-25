import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'documents');
    this.client = new S3Client({
      endpoint: this.config.get<string>('MINIO_ENDPOINT', 'http://localhost:9000'),
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('MINIO_ROOT_USER', 'minio'),
        secretAccessKey: this.config.get<string>('MINIO_ROOT_PASSWORD', 'minio123'),
      },
      forcePathStyle: true,
    });
  }

  async upload(opts: {
    key: string;
    buffer: Buffer;
    mimetype: string;
  }): Promise<string> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: opts.key,
        Body: opts.buffer,
        ContentType: opts.mimetype,
      },
    });

    await upload.done();
    this.logger.log(`Uploaded ${opts.key} to ${this.bucket}`);
    return `${this.bucket}/${opts.key}`;
  }

  async delete(storageRef: string): Promise<void> {
    const [bucket, ...keyParts] = storageRef.split('/');
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: keyParts.join('/') }));
  }
}
