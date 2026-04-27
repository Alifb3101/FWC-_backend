import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildProductImageKey,
  buildProductVideoKey,
  buildPublicUrl,
  extractKeyFromPublicUrl,
  sanitizeSlug,
} from './utils/media-path.util';

type UploadedMedia = {
  key: string;
  url: string;
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly maxImageBytes: number;
  private readonly maxVideoBytes: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const accessKeyId = this.configService.getOrThrow<string>('r2.accessKey');
    const secretAccessKey = this.configService.getOrThrow<string>('r2.secretKey');
    const endpoint = this.configService.getOrThrow<string>('r2.endpoint');

    this.bucket = this.configService.getOrThrow<string>('r2.bucket');
    this.publicUrl = this.configService.getOrThrow<string>('r2.publicUrl');
    this.maxImageBytes = this.configService.get<number>('media.maxImageBytes') ?? 6 * 1024 * 1024;
    this.maxVideoBytes = this.configService.get<number>('media.maxVideoBytes') ?? 150 * 1024 * 1024;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      requestHandler: new NodeHttpHandler({ connectionTimeout: 3000, socketTimeout: 15000 }),
      maxAttempts: 3,
    });
  }

  getImageUploadLimit(): number {
    return this.maxImageBytes;
  }

  getVideoUploadLimit(): number {
    return this.maxVideoBytes;
  }

  async uploadProductImages(slug: string, files: Express.Multer.File[]): Promise<string[]> {
    const normalizedSlug = sanitizeSlug(slug);

    const optimizedBuffers = await Promise.all(
      files.map((file) =>
        sharp(file.buffer)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer(),
      ),
    );

    const uploads = await Promise.all(
      optimizedBuffers.map((buffer, index) => {
        const key = buildProductImageKey(normalizedSlug, index);
        return this.putObject(key, buffer, 'image/webp');
      }),
    );

    return uploads.map((item) => item.url);
  }

  async uploadProductVideo(slug: string, file: Express.Multer.File): Promise<string> {
    const normalizedSlug = sanitizeSlug(slug);
    const extension = file.mimetype === 'video/webm' ? 'webm' : 'mp4';
    const key = buildProductVideoKey(normalizedSlug, extension);

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      },
      queueSize: 2,
      partSize: 10 * 1024 * 1024,
      leavePartsOnError: false,
    });

    await upload.done();
    return buildPublicUrl(this.publicUrl, key);
  }

  async updateProductImages(productId: number, urls: string[]): Promise<void> {
    await this.prisma.productImage.deleteMany({ where: { productId } });

    if (urls.length > 0) {
      await this.prisma.productImage.createMany({
        data: urls.map((url, index) => ({
          productId,
          url,
          sortOrder: index,
        })),
      });
    }
  }

  async deleteByUrls(urls: string[]): Promise<void> {
    const keys = urls
      .map((url) => extractKeyFromPublicUrl(this.publicUrl, url))
      .filter((key): key is string => Boolean(key));

    if (keys.length === 0) {
      return;
    }

    await this.deleteObjects(keys);
  }

  async deleteObjects(keys: string[]): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
            Quiet: true,
          },
        }),
      );
    } catch (error) {
      this.logger.warn('Failed to delete media objects from R2.');
    }
  }

  async uploadGenericImage(file: Express.Multer.File): Promise<UploadedMedia> {
    const key = `uploads/${sanitizeSlug(file.originalname)}-${Date.now()}.webp`;
    const buffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return this.putObject(key, buffer, 'image/webp');
  }

  private async putObject(key: string, body: Buffer, contentType: string): Promise<UploadedMedia> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      key,
      url: buildPublicUrl(this.publicUrl, key),
    };
  }
}
