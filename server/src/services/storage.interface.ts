export interface IStorageProvider {
  name: 's3' | 'local';
  
  /**
   * Store an encrypted block binary
   */
  putBlock(storageKey: string, data: Buffer, contentType?: string): Promise<void>;

  /**
   * Retrieve an encrypted block binary
   */
  getBlock(storageKey: string): Promise<Buffer>;

  /**
   * Store the authenticated manifest JSON
   */
  putManifest(storageKey: string, manifest: object): Promise<void>;

  /**
   * Retrieve the manifest JSON
   */
  getManifest(storageKey: string): Promise<any>;

  /**
   * Delete all blocks and manifest for a given file
   */
  deleteFile(fileId: string, userId: string, blockCount: number): Promise<void>;

  /**
   * Check health and access to the storage backend
   */
  checkHealth(): Promise<{ status: boolean; message: string; details?: any }>;
}
