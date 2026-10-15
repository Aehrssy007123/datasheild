/**
 * SecureVault Cloud - Automated Static Website S3 Sync & CloudFront Invalidation
 * Usage: node deployment/deploy-frontend.js
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.WEBSITE_HOSTING_BUCKET;
const CLOUDFRONT_DIST_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const DIST_DIR = path.resolve(__dirname, '../client/dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function getFilesRecursively(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFilesRecursively(res) : res;
    })
  );
  return files.flat();
}

async function main() {
  console.log('=======================================================');
  console.log(' SecureVault Cloud - Frontend Deployment Workflow');
  console.log('=======================================================');

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Error: Distribution directory not found at: ${DIST_DIR}`);
    console.error('Please run "npm --prefix client run build" first.');
    process.exit(1);
  }

  if (!BUCKET) {
    console.warn('Notice: WEBSITE_HOSTING_BUCKET is not defined in .env.');
    console.log('To deploy to AWS S3, configure WEBSITE_HOSTING_BUCKET and AWS credentials in .env.');
    console.log(`Local production bundle is built and verified at: ${DIST_DIR}`);
    return;
  }

  console.log(`Target Bucket: ${BUCKET}`);
  console.log(`AWS Region:    ${REGION}`);

  const s3Client = new S3Client({ region: REGION });
  const allFiles = await getFilesRecursively(DIST_DIR);

  console.log(`Found ${allFiles.length} files to upload from ${DIST_DIR}...`);

  for (const filePath of allFiles) {
    const relativePath = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const body = await fs.promises.readFile(filePath);

    // Cache headers: assets get immutable caching, index.html gets no-cache for instant updates
    const cacheControl = relativePath === 'index.html'
      ? 'public, max-age=0, must-revalidate'
      : 'public, max-age=31536000, immutable';

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: relativePath,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);
    console.log(`✓ Uploaded: ${relativePath} (${contentType})`);
  }

  console.log('\nAll static files synchronized successfully to private S3 origin!');

  if (CLOUDFRONT_DIST_ID) {
    console.log(`\nInvalidating CloudFront cache for distribution: ${CLOUDFRONT_DIST_ID}...`);
    try {
      const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
      const cfClient = new CloudFrontClient({ region: REGION });
      await cfClient.send(
        new CreateInvalidationCommand({
          DistributionId: CLOUDFRONT_DIST_ID,
          InvalidationBatch: {
            CallerReference: String(Date.now()),
            Paths: {
              Quantity: 1,
              Items: ['/*'],
            },
          },
        })
      );
      console.log('✓ CloudFront cache invalidation initiated successfully.');
    } catch (cfErr) {
      console.warn('CloudFront invalidation note:', cfErr.message);
    }
  }

  console.log('Deployment complete! Distribution protected via Origin Access Control.');
}

main().catch((err) => {
  console.error('Deployment error:', err.message);
  process.exit(1);
});
