import fs from 'fs/promises';
import path from 'path';
import { FileRecord } from '../types';

export class DbService {
  private static dbPath = path.resolve(process.cwd(), '.storage', 'metadata_db.json');
  private static cache: Map<string, FileRecord> = new Map();
  private static isLoaded = false;

  private static async ensureLoaded() {
    if (this.isLoaded) return;
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      const raw = await fs.readFile(this.dbPath, 'utf-8');
      const records: FileRecord[] = JSON.parse(raw);
      records.forEach((r) => this.cache.set(r.fileId, r));
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Error loading metadata DB:', err);
      }
      this.cache.clear();
    }
    this.isLoaded = true;
  }

  private static async persist() {
    try {
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      const records = Array.from(this.cache.values());
      await fs.writeFile(this.dbPath, JSON.stringify(records, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting metadata DB:', err);
    }
  }

  public static async saveFileRecord(record: FileRecord): Promise<void> {
    await this.ensureLoaded();
    this.cache.set(record.fileId, record);
    await this.persist();
  }

  public static async getFileRecord(fileId: string): Promise<FileRecord | undefined> {
    await this.ensureLoaded();
    return this.cache.get(fileId);
  }

  public static async listFiles(userId?: string): Promise<FileRecord[]> {
    await this.ensureLoaded();
    const list = Array.from(this.cache.values());
    if (userId) {
      return list.filter((f) => f.userId === userId);
    }
    return list;
  }

  public static async deleteFileRecord(fileId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.cache.delete(fileId);
    if (deleted) {
      await this.persist();
    }
    return deleted;
  }
}
