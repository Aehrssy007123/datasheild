import React, { useState } from 'react';
import {
  Settings2,
  Shield,
  Key,
  Copy,
  Check,
  Server,
  Cloud,
  Globe2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { CloudStatusInfo } from '../types';

interface CloudConfigPageProps {
  cloudStatus: CloudStatusInfo | null;
}

export const CloudConfigPage: React.FC<CloudConfigPageProps> = ({ cloudStatus }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const iamPolicyJson = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecureVaultLeastPrivilegeS3",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${cloudStatus?.s3BucketName || 'securevault-cloud-storage'}",
        "arn:aws:s3:::${cloudStatus?.s3BucketName || 'securevault-cloud-storage'}/*"
      ]
    }
  ]
}`;

  const bucketPolicyJson = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::securevault-website-bucket/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_AWS_ACCOUNT_ID:distribution/${cloudStatus?.cloudFrontDomain || 'DIST_ID'}"
        }
      }
    }
  ]
}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-vault-100 tracking-tight flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-vault-400" /> Cloud Architecture & Security Configuration
        </h2>
        <p className="text-sm text-vault-500 mt-1">
          Detailed AWS setup guide: Amazon S3 private storage, IAM least-privilege policies, CloudFront Origin Access
          Control, and HTTPS configuration.
        </p>
      </div>

      {/* Security Rule Callout */}
      <div className="p-4 rounded-xl bg-vault-bronze/10 border border-vault-700/50 text-xs text-vault-300 flex items-start space-x-3">
        <Lock className="w-5 h-5 flex-shrink-0 text-vault-400 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-vault-100">Strict Zero-Secret Frontend Guarantee: </span>
          AWS secret access keys and IAM credentials are NEVER requested, handled, or stored by the browser client.
          The browser only holds encryption keys in transient memory for client-side cryptographic operations.
          Backend credentials are kept exclusively on the server in protected environment variables or IAM roles.
        </div>
      </div>

      {/* Current Runtime Status */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <h3 className="text-base font-semibold text-vault-100">Active Storage Adapter Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-vault-850/70 border border-vault-800">
            <span className="text-vault-500 block text-[11px]">Storage Provider</span>
            <span className="text-vault-100 font-bold mt-1 block uppercase">
              {cloudStatus?.storageProvider === 's3' ? 'AWS S3 (Live)' : 'Local Object Adapter'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-vault-850/70 border border-vault-800">
            <span className="text-vault-500 block text-[11px]">Target S3 Bucket</span>
            <span className="text-vault-400 font-bold mt-1 block truncate">
              {cloudStatus?.s3BucketName || 'local-securevault-bucket'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-vault-850/70 border border-vault-800">
            <span className="text-vault-500 block text-[11px]">AWS Region</span>
            <span className="text-vault-bronze font-bold mt-1 block">
              {cloudStatus?.awsRegion || 'us-east-1'}
            </span>
          </div>
        </div>
      </div>

      {/* IAM Least-Privilege Policy */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-vault-100">1. IAM Least-Privilege Policy</h3>
            <p className="text-xs text-vault-500 mt-0.5">
              Attach this policy to your AWS IAM user or backend EC2/Lambda execution role.
            </p>
          </div>
          <button
            onClick={() => handleCopy(iamPolicyJson, 'iam')}
            className="px-3 py-1.5 rounded-lg bg-vault-800 hover:bg-vault-700 text-xs text-vault-400 font-medium flex items-center gap-1.5 border border-vault-700"
          >
            {copiedKey === 'iam' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'iam' ? 'Copied' : 'Copy Policy'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-vault-950 text-vault-400 font-mono text-xs overflow-x-auto border border-vault-800">
          {iamPolicyJson}
        </pre>
      </div>

      {/* CloudFront Origin Access Control (OAC) Policy */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-vault-100">2. S3 Bucket Policy with CloudFront OAC</h3>
            <p className="text-xs text-vault-500 mt-0.5">
              Ensures the website-hosting bucket remains 100% private and accessible only through CloudFront.
            </p>
          </div>
          <button
            onClick={() => handleCopy(bucketPolicyJson, 'oac')}
            className="px-3 py-1.5 rounded-lg bg-vault-800 hover:bg-vault-700 text-xs text-vault-400 font-medium flex items-center gap-1.5 border border-vault-700"
          >
            {copiedKey === 'oac' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'oac' ? 'Copied' : 'Copy Policy'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-vault-950 text-vault-400 font-mono text-xs overflow-x-auto border border-vault-800">
          {bucketPolicyJson}
        </pre>
      </div>

      {/* Environment Variables Reference */}
      <div className="p-6 rounded-2xl bg-vault-900 border border-vault-800 space-y-4">
        <h3 className="text-base font-semibold text-vault-100">3. Environment Variables Reference (.env)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-vault-400 font-mono">
            <thead className="bg-vault-950 text-vault-500 uppercase border-b border-vault-800">
              <tr>
                <th className="px-4 py-3">Variable</th>
                <th className="px-4 py-3">Example Value</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vault-800/60 font-sans">
              <tr>
                <td className="px-4 py-3 font-mono text-vault-400">STORAGE_PROVIDER</td>
                <td className="px-4 py-3 font-mono">s3 or local</td>
                <td className="px-4 py-3 text-vault-500">Selects AWS S3 or Local Adapter mode</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-vault-400">AWS_REGION</td>
                <td className="px-4 py-3 font-mono">us-east-1</td>
                <td className="px-4 py-3 text-vault-500">Target AWS Region for S3 bucket</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-vault-400">S3_BUCKET_NAME</td>
                <td className="px-4 py-3 font-mono">securevault-storage</td>
                <td className="px-4 py-3 text-vault-500">Private S3 bucket name for blocks</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-vault-400">CLOUDFRONT_DOMAIN</td>
                <td className="px-4 py-3 font-mono">d12345.cloudfront.net</td>
                <td className="px-4 py-3 text-vault-500">Domain for website CDN distribution</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
