import { Request, Response } from 'express';
import { StorageFactory } from '../services/storage.factory';
import { DbService } from '../services/db.service';

export class CloudController {
  public static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const storageProvider = StorageFactory.getStorageProvider();
      const health = await storageProvider.checkHealth();
      const allFiles = await DbService.listFiles();

      const totalOriginalBytes = allFiles.reduce((acc, f) => acc + (f.originalSize || 0), 0);
      const totalBlocks = allFiles.reduce((acc, f) => acc + (f.totalBlocks || 0), 0);

      const isAwsConfigured = !!(
        process.env.AWS_REGION &&
        process.env.S3_BUCKET_NAME &&
        (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE)
      );

      const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN || '';
      const cloudFrontConfigured = !!(cloudFrontDomain && cloudFrontDomain !== 'your-cloudfront-domain');

      res.status(200).json({
        storageProvider: storageProvider.name,
        isAwsConfigured,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        s3BucketName: process.env.S3_BUCKET_NAME || 'local-securevault-bucket',
        bucketAccessible: health.status,
        healthMessage: health.message,
        cloudFrontDomain: cloudFrontConfigured ? cloudFrontDomain : '',
        cloudFrontConfigured,
        totalFiles: allFiles.length,
        totalOriginalBytes,
        totalBlocks,
        serverTimestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error getting cloud status:', err);
      res.status(500).json({ error: 'Failed to retrieve cloud status', details: err.message });
    }
  }
}
