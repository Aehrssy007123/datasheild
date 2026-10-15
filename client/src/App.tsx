import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { SecureUploadPage } from './pages/SecureUploadPage';
import { MyFilesPage } from './pages/MyFilesPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { EncryptionLabPage } from './pages/EncryptionLabPage';
import { CdnAnalyticsPage } from './pages/CdnAnalyticsPage';
import { CloudConfigPage } from './pages/CloudConfigPage';
import { ProjectDocumentationPage } from './pages/ProjectDocumentationPage';
import { CloudStatusInfo } from './types';
import { ApiService } from './services/api.service';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [cloudStatus, setCloudStatus] = useState<CloudStatusInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [downloadTargetFileId, setDownloadTargetFileId] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    fetchCloudStatus();
  }, []);

  const fetchCloudStatus = async () => {
    try {
      setIsRefreshing(true);
      const status = await ApiService.getCloudStatus();
      setCloudStatus(status);
    } catch (err) {
      console.error('Failed to fetch cloud status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now());
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateToDownload = (fileId: string) => {
    setDownloadTargetFileId(fileId);
    setCurrentPage('downloads');
  };

  const getPageTitleAndSubtitle = (): { title: string; subtitle: string } => {
    switch (currentPage) {
      case 'dashboard':
        return {
          title: 'Security Operations Dashboard',
          subtitle: 'Cryptographic storage overview, block distribution metrics, and cloud status',
        };
      case 'upload':
        return {
          title: 'Secure File Upload',
          subtitle: 'Client-side file segmentation, AES-256-GCM encryption, and S3 block storage',
        };
      case 'files':
        return {
          title: 'Encrypted Files Repository',
          subtitle: 'Listing of authenticated file manifests and encrypted object blocks',
        };
      case 'downloads':
        return {
          title: 'Decryption & Reconstruction Pipeline',
          subtitle: 'Block-by-block tag verification, ordered reassembly, and SHA-256 integrity check',
        };
      case 'encryption-lab':
        return {
          title: 'Cryptographic Laboratory',
          subtitle: 'Interactive exploration of Galois/Counter Mode, nonces, and tampering detection',
        };
      case 'cdn-analytics':
        return {
          title: 'Amazon CloudFront CDN Analytics',
          subtitle: 'Global content distribution, HTTPS configuration, and comparative latency benchmark',
        };
      case 'cloud-config':
        return {
          title: 'Cloud Architecture Configuration',
          subtitle: 'AWS S3 private bucket, IAM least-privilege policies, and Origin Access Control',
        };
      case 'documentation':
        return {
          title: 'Project Documentation & Viva Preparation',
          subtitle: 'Academic specifications, IEEE/NIST references, and computer engineering examination guide',
        };
      default:
        return {
          title: 'SecureVault Cloud',
          subtitle: 'Encrypted Cloud File Storage Suite',
        };
    }
  };

  const pageMeta = getPageTitleAndSubtitle();

  return (
    <div className="flex min-h-screen font-sans" style={{ background: '#0d0906', color: '#f0dfc0' }}>
      {/* Fixed Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => setCurrentPage(page)}
        cloudStatus={cloudStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          cloudStatus={cloudStatus}
          onRefresh={fetchCloudStatus}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-8 overflow-y-auto" style={{ background: 'transparent' }}>
          <div key={currentPage} className="animate-fade-in">
            {currentPage === 'dashboard' && (
              <DashboardPage onNavigate={(page) => setCurrentPage(page)} cloudStatus={cloudStatus} />
            )}

            {currentPage === 'upload' && (
              <SecureUploadPage
                onSuccessNavigate={(page) => setCurrentPage(page)}
                onShowToast={showToast}
              />
            )}

            {currentPage === 'files' && (
              <MyFilesPage
                onNavigateToDownload={navigateToDownload}
                onShowToast={showToast}
              />
            )}

            {currentPage === 'downloads' && (
              <DownloadsPage
                initialFileId={downloadTargetFileId}
                onShowToast={showToast}
              />
            )}

            {currentPage === 'encryption-lab' && <EncryptionLabPage />}

            {currentPage === 'cdn-analytics' && <CdnAnalyticsPage cloudStatus={cloudStatus} />}

            {currentPage === 'cloud-config' && <CloudConfigPage cloudStatus={cloudStatus} />}

            {currentPage === 'documentation' && <ProjectDocumentationPage />}
          </div>
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
