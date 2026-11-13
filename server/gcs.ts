import { Storage } from "@google-cloud/storage";

const bucketName = process.env.GCS_BUCKET_NAME;

// Lazy-initialised so the module can be imported even when GCS is not configured
let _bucket: ReturnType<Storage["bucket"]> | null = null;

function getBucket() {
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME environment variable is not set");
  }
  if (!_bucket) {
    _bucket = new Storage().bucket(bucketName);
  }
  return _bucket;
}

export function isGCSConfigured(): boolean {
  return Boolean(bucketName);
}

export async function uploadToGCS(
  buffer: Buffer,
  objectName: string,
  mimetype: string
): Promise<string> {
  const bucket = getBucket();
  const file = bucket.file(objectName);
  await file.save(buffer, { contentType: mimetype, resumable: false });
  // Public access is granted via bucket-level IAM (allUsers → Storage Object Viewer)
  // so no per-object ACL call is needed here.
  return `https://storage.googleapis.com/${bucketName}/${objectName}`;
}

export async function deleteFromGCS(objectName: string): Promise<void> {
  const bucket = getBucket();
  await bucket.file(objectName).delete({ ignoreNotFound: true });
}

export interface GCSMediaFile {
  name: string;
  url: string;
  updated: string;
}

export async function listGCSFiles(prefix?: string): Promise<GCSMediaFile[]> {
  const bucket = getBucket();
  const [files] = await bucket.getFiles({ prefix });
  return files
    .filter((f) => !f.name.endsWith("/")) // skip directory placeholders
    .map((f) => ({
      name: f.name,
      url: `https://storage.googleapis.com/${bucketName}/${f.name}`,
      updated: (f.metadata.updated as string) ?? "",
    }));
}
