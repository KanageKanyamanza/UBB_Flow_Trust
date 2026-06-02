import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';

export class StorageService {
  private uploadDir = path.join(process.cwd(), 'uploads');
  private s3Client: S3Client | null = null;
  private storageType: string;
  private bucket: string;

  constructor() {
    this.storageType = process.env.STORAGE_TYPE || 'local';
    this.bucket = process.env.S3_BUCKET || 'ubb-flow-storage';

    if (this.storageType === 's3' || this.storageType === 'minio') {
      this.s3Client = new S3Client({
        region: process.env.S3_REGION || 'eu-west-3',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || '',
          secretAccessKey: process.env.S3_SECRET_KEY || '',
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      });
    }

    if (this.storageType === 'local') {
      this.initLocal();
    }
  }

  private async initLocal() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async processAndStoreImage(fileBuffer: Buffer): Promise<string> {
    const filename = `${crypto.randomUUID()}.webp`;
    
    // Process with Sharp (convert to webp, compress)
    const processedBuffer = await sharp(fileBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    if (this.storageType === 'local') {
      const filepath = path.join(this.uploadDir, filename);
      await fs.writeFile(filepath, processedBuffer);
      return `/uploads/${filename}`;
    }

    if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: processedBuffer,
        ContentType: 'image/webp',
        // Optional: ACL: 'public-read' if the bucket allows it
      });

      await this.s3Client.send(command);
      
      // Return URL or key
      // If public, build URL. If private, return key and use signed URLs for display.
      const endpoint = process.env.S3_ENDPOINT;
      if (endpoint && this.storageType === 'minio') {
        return `${endpoint}/${this.bucket}/${filename}`;
      }
      
      return `https://${this.bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${filename}`;
    }

    throw new Error('Storage service not properly configured');
  }

  async storeFile(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = path.extname(originalName);
    const filename = `${crypto.randomUUID()}${ext}`;
    
    if (this.storageType === 'local') {
      const filepath = path.join(this.uploadDir, filename);
      await fs.writeFile(filepath, fileBuffer);
      return `/uploads/${filename}`;
    }

    if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      
      const endpoint = process.env.S3_ENDPOINT;
      if (endpoint && (this.storageType === 'minio' || this.storageType === 's3')) {
        // Simple URL construction. For production S3, might need a more robust URL builder
        if (this.storageType === 'minio') {
            return `${endpoint}/${this.bucket}/${filename}`;
        }
      }
      
      return `https://${this.bucket}.s3.${process.env.S3_REGION || 'eu-west-3'}.amazonaws.com/${filename}`;
    }

    throw new Error('Storage service not properly configured');
  }

  async getFileBuffer(fileUrlOrKey: string): Promise<Buffer> {
    if (this.storageType === 'local' || !fileUrlOrKey.startsWith('http')) {
      const filename = path.basename(fileUrlOrKey);
      const filepath = path.join(this.uploadDir, filename);
      return await fs.readFile(filepath);
    }

    if (this.storageType === 's3' || this.storageType === 'minio') {
      if (this.s3Client) {
        const key = path.basename(fileUrlOrKey);
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        const response = await this.s3Client.send(command);
        if (response.Body) {
          const chunks: any[] = [];
          const stream = response.Body as any;
          for await (const chunk of stream) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          return Buffer.concat(chunks);
        }
      }

      const response = await fetch(fileUrlOrKey);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from remote storage: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    throw new Error('Storage service not properly configured');
  }

  async deleteFile(fileUrlOrKey: string): Promise<void> {
    if (this.storageType === 'local') {
      const filename = path.basename(fileUrlOrKey);
      const filepath = path.join(this.uploadDir, filename);
      try {
        await fs.unlink(filepath);
      } catch (err) {
        console.error(`Failed to delete local file: ${filepath}`, err);
      }
      return;
    }

    if (this.s3Client) {
      const key = path.basename(fileUrlOrKey);
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
    }
  }
}

export const storageService = new StorageService();
