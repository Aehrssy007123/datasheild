import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { IStorageProvider } from './storage.interface';
import { Readable } from 'stream';

export interface S3ServiceConfig {
  region: string;
  bucketName: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export class S3StorageService implements IStorageProvider {
  name: 's3' = 's3';
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: S3ServiceConfig) {
    this.bucketName = config.bucketName;

    const clientConfig: any = {
      region: config.region || 'us-east-1',
    };

    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        sessionToken: config.sessionToken,
      };
    }

    this.s3Client = new S3Client(clientConfig);
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async putBlock(storageKey: string, data: Buffer, contentType: string = 'application/octet-stream'): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      Body: data,
      ContentType: contentType,
      // Ensure server-side encryption with AWS-managed key (SSE-S3 or SSE-KMS) in addition to client encryption
      ServerSideEncryption: 'AES256',
    });

    await this.s3Client.send(command);
  }

  async getBlock(storageKey: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Empty response body from S3 for key: ${storageKey}`);
    }

    return this.streamToBuffer(response.Body as Readable);
  }

  async putManifest(storageKey: string, manifest: object): Promise<void> {
    const body = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
      Body: body,
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
    });

    await this.s3Client.send(command);
  }

  async getManifest(storageKey: string): Promise<any> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Empty manifest response from S3 for key: ${storageKey}`);
    }

    const buffer = await this.streamToBuffer(response.Body as Readable);
    return JSON.parse(buffer.toString('utf-8'));
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const prefix = `secure-files/${userId}/${fileId}/`;

    // 1. List all objects with prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const listOutput = await this.s3Client.send(listCommand);
    if (!listOutput.Contents || listOutput.Contents.length === 0) {
      return;
    }

    // 2. Batch delete objects
    const objectsToDelete = listOutput.Contents.map((obj) => ({ Key: obj.Key! }));
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true,
      },
    });

    await this.s3Client.send(deleteCommand);
  }

  async checkHealth(): Promise<{ status: boolean; message: string; details?: any }> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucketName,
      });
      await this.s3Client.send(command);
      return {
        status: true,
        message: `Amazon S3 Bucket '${this.bucketName}' accessible and active`,
        details: { bucket: this.bucketName },
      };
    } catch (err: any) {
      return {
        status: false,
        message: `AWS S3 Connection Error: ${err.message || 'Access Denied or Bucket Not Found'}`,
        details: { code: err.name, statusCode: err.$metadata?.httpStatusCode },
      };
    }
  }
}
