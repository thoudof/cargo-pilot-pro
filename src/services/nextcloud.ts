
import { NextCloudConfig, SyncStatus } from '@/types';
import { Network } from '@capacitor/network';

class NextCloudService {
  private config: NextCloudConfig | null = null;
  private syncStatus: SyncStatus = {
    lastSync: null,
    pendingUploads: 0,
    isOnline: false,
    syncInProgress: false
  };

  async configure(config: NextCloudConfig): Promise<void> {
    this.config = config;
    await this.checkConnection();
  }

  async checkConnection(): Promise<boolean> {
    if (!this.config) return false;
    
    try {
      const status = await Network.getStatus();
      this.syncStatus.isOnline = status.connected;
      
      if (status.connected) {
        const response = await fetch(`${this.config.serverUrl}/status.php`);
        return response.ok;
      }
      return false;
    } catch (error) {
      console.error('NextCloud connection check failed:', error);
      return false;
    }
  }

  async createFolder(path: string): Promise<boolean> {
    if (!this.config || !this.syncStatus.isOnline) return false;

    try {
      const fullPath = `${this.config.basePath}/${path}`;
      const response = await fetch(`${this.config.serverUrl}/remote.php/dav/files/${this.config.username}/${fullPath}`, {
        method: 'MKCOL',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
        }
      });
      
      return response.ok || response.status === 405; // 405 means folder already exists
    } catch (error) {
      console.error('Failed to create folder:', error);
      return false;
    }
  }

  async uploadFile(localPath: string, remotePath: string, file: File): Promise<boolean> {
    if (!this.config || !this.syncStatus.isOnline) {
      this.syncStatus.pendingUploads++;
      return false;
    }

    try {
      const fullPath = `${this.config.basePath}/${remotePath}`;
      const response = await fetch(`${this.config.serverUrl}/remote.php/dav/files/${this.config.username}/${fullPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': file.type
        },
        body: file
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to upload file:', error);
      this.syncStatus.pendingUploads++;
      return false;
    }
  }

  async downloadFile(remotePath: string): Promise<Blob | null> {
    if (!this.config || !this.syncStatus.isOnline) return null;

    try {
      const fullPath = `${this.config.basePath}/${remotePath}`;
      const response = await fetch(`${this.config.serverUrl}/remote.php/dav/files/${this.config.username}/${fullPath}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
        }
      });
      
      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      console.error('Failed to download file:', error);
      return null;
    }
  }

  async listFiles(remotePath: string): Promise<string[]> {
    if (!this.config || !this.syncStatus.isOnline) return [];

    try {
      const fullPath = `${this.config.basePath}/${remotePath}`;
      const response = await fetch(`${this.config.serverUrl}/remote.php/dav/files/${this.config.username}/${fullPath}`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Depth': '1'
        }
      });
      
      if (response.ok) {
        const xml = await response.text();
        // Parse XML response to extract file names
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const hrefs = doc.querySelectorAll('d\\:href, href');
        
        return Array.from(hrefs)
          .map(href => href.textContent || '')
          .filter(href => href && !href.endsWith('/'))
          .map(href => href.split('/').pop() || '');
      }
      return [];
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  async syncPendingUploads(): Promise<void> {
    if (!this.config || !this.syncStatus.isOnline || this.syncStatus.syncInProgress) return;
    
    this.syncStatus.syncInProgress = true;
    
    try {
      // Implement pending uploads sync logic here
      this.syncStatus.pendingUploads = 0;
      this.syncStatus.lastSync = new Date();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async initializeStructure(): Promise<void> {
    if (!this.config) return;

    const folders = [
      'transport',
      'transport/рейсы',
      'transport/контрагенты'
    ];

    for (const folder of folders) {
      await this.createFolder(folder);
    }
  }
}

export const nextCloudService = new NextCloudService();
