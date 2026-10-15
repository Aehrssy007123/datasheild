import fs from 'fs/promises';
import path from 'path';
import { IStorageProvider } from './storage.interface';

export class LocalStorageService implements IStorageProvider {
  name: 'local' = 'local';
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.resolve(process.cwd(), '.storage', 's3-bucket');
  }

  private getFilePath(storageKey: string): string {
    // Sanitize storage key to avoid directory traversal
    const safeKey = storageKey.replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.baseDir, safeKey);
  }

  async putBlock(storageKey: string, data: Buffer): Promise<void> {
    const fullPath = this.getFilePath(storageKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async getBlock(storageKey: string): Promise<Buffer> {
    const fullPath = this.getFilePath(storageKey);
    try {
      return await fs.readFile(fullPath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(`Block not found at key: ${storageKey}`);
      }
      throw err;
    }
  }

  async putManifest(storageKey: string, manifest: object): Promise<void> {
    const fullPath = this.getFilePath(storageKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  async getManifest(storageKey: string): Promise<any> {
    const fullPath = this.getFilePath(storageKey);
    try {
      const data = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(data);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(`Manifest not found at key: ${storageKey}`);
      }
      throw err;
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const fileDir = path.join(this.baseDir, 'secure-files', userId, fileId);
    try {
      await fs.rm(fileDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore directory not found on delete
    }
  }

  async checkHealth(): Promise<{ status: boolean; message: string; details?: any }> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      return {
        status: true,
        message: 'Local Object Storage Adapter ready (.storage/s3-bucket)',
        details: { directory: this.baseDir },
      };
    } catch (err: any) {
      return {
        status: false,
        message: `Local Object Storage directory error: ${err.message}`,
      };
    }
  }
}
