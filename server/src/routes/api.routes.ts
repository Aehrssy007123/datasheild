import { Router } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/file.controller';
import { CloudController } from '../controllers/cloud.controller';
import { CdnController } from '../controllers/cdn.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per block limit
  },
});

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'SecureVault Cloud API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Cloud Status
router.get('/cloud/status', CloudController.getStatus);

// File Operations
router.post('/files/initiate', FileController.initiateUpload);
router.put('/files/:fileId/blocks/:blockIndex', upload.single('block'), FileController.uploadBlock);
router.post('/files/:fileId/complete', FileController.completeUpload);
router.get('/files', FileController.listFiles);
router.get('/files/:fileId/manifest', FileController.getManifest);
router.get('/files/:fileId/blocks/:blockIndex', FileController.getBlock);
router.delete('/files/:fileId', FileController.deleteFile);

// CDN Benchmark Endpoint
router.get('/cdn/benchmark', CdnController.benchmark);

export default router;
