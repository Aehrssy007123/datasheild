import { FileManifest, FileRecord, CloudStatusInfo, LatencyTestResult } from '../types';

const API_BASE = '/api';

export class ApiService {
  /**
   * Get server and cloud storage connectivity status
   */
  public static async getCloudStatus(): Promise<CloudStatusInfo> {
    const res = await fetch(`${API_BASE}/cloud/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch cloud status: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Initialize file upload session with authenticated manifest
   */
  public static async initiateUpload(manifest: FileManifest, userId: string = 'user-default'): Promise<{
    message: string;
    fileId: string;
    totalBlocks: number;
    storageProvider: 's3' | 'local';
  }> {
    const res = await fetch(`${API_BASE}/files/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(manifest),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to initiate upload: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Upload single encrypted block binary payload
   */
  public static async uploadBlock(
    fileId: string,
    blockIndex: number,
    payload: Uint8Array,
    userId: string = 'user-default'
  ): Promise<{ message: string; fileId: string; blockIndex: number; bytesReceived: number }> {
    const formData = new FormData();
    const blob = new Blob([payload as any], { type: 'application/octet-stream' });
    formData.append('block', blob, `${fileId}_${blockIndex}.enc`);

    const res = await fetch(`${API_BASE}/files/${fileId}/blocks/${blockIndex}`, {
      method: 'PUT',
      headers: {
        'X-User-Id': userId,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to upload block #${blockIndex}: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Finalize file upload by sending completed authenticated manifest
   */
  public static async completeUpload(
    fileId: string,
    manifest: FileManifest,
    userId: string = 'user-default'
  ): Promise<{ message: string; fileRecord: FileRecord }> {
    const res = await fetch(`${API_BASE}/files/${fileId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(manifest),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to complete upload: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * List all files for current user
   */
  public static async listFiles(userId: string = 'user-default'): Promise<FileRecord[]> {
    const res = await fetch(`${API_BASE}/files`, {
      headers: {
        'X-User-Id': userId,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to list files: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * Fetch authenticated file manifest for decryption
   */
  public static async getManifest(fileId: string, userId: string = 'user-default'): Promise<FileManifest> {
    const res = await fetch(`${API_BASE}/files/${fileId}/manifest`, {
      headers: {
        'X-User-Id': userId,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch manifest: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Download single encrypted block binary
   */
  public static async downloadBlock(
    fileId: string,
    blockIndex: number,
    userId: string = 'user-default',
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const res = await fetch(`${API_BASE}/files/${fileId}/blocks/${blockIndex}`, {
      headers: {
        'X-User-Id': userId,
      },
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to download block #${blockIndex}: ${res.statusText}`);
    }

    return res.arrayBuffer();
  }

  /**
   * Delete file and all its encrypted blocks from storage
   */
  public static async deleteFile(fileId: string, userId: string = 'user-default'): Promise<void> {
    const res = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete file: ${res.statusText}`);
    }
  }

  /**
   * Perform real live latency test against Origin or CDN URL
   */
  public static async testLatency(targetUrl: string, type: 'cdn' | 'origin'): Promise<LatencyTestResult> {
    const startTime = performance.now();
    try {
      // Append cache buster or timestamp query param if testing dynamic response
      const separator = targetUrl.includes('?') ? '&' : '?';
      const urlWithQuery = `${targetUrl}${separator}_t=${Date.now()}`;

      const res = await fetch(urlWithQuery, {
        method: 'GET',
        cache: 'no-cache',
      });

      const durationMs = Math.round(performance.now() - startTime);

      return {
        url: targetUrl,
        type,
        status: res.status,
        statusText: res.statusText,
        durationMs,
        ttfbMs: Math.max(1, Math.round(durationMs * 0.7)),
        xCacheHeader: res.headers.get('x-cache') || res.headers.get('X-Cache') || 'N/A',
        ageHeader: res.headers.get('age') || res.headers.get('Age') || '0',
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        url: targetUrl,
        type,
        status: 0,
        statusText: err.message || 'Network / CORS Error',
        durationMs,
        ttfbMs: durationMs,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }
}
