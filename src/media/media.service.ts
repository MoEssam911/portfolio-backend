import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

import { PrismaService } from 'src/prisma/prisma.service';
import { buildPaginationMeta } from 'src/common/utils/pagination.util';

@Injectable()
export class MediaService {
  private readonly folder: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: configService.getOrThrow<string>('storage.cloudName'),
      api_key: configService.getOrThrow<string>('storage.apiKey'),
      api_secret: configService.getOrThrow<string>('storage.apiSecret'),
    });

    this.folder = configService.getOrThrow<string>('storage.folder');
  }

  async uploadFile(userId: string, file: Express.Multer.File) {
    this.validateFile(file);

    let result: UploadApiResponse;

    try {
      result = await this.uploadToCloudinary(
        file.buffer,
        `${this.folder}/${userId}`,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'File upload failed',
      );
    }

    return this.prisma.media.create({
      data: {
        userId,
        key: result.public_id,
        url: result.secure_url,
        size: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname,
        type: this.getMediaType(file.mimetype),
      },
    });
  }

  async getAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.media.count({ where: { userId } }),
    ]);

    return {
      data: items,
      meta: buildPaginationMeta({ page, limit, total }),
    };
  }

  async getById(userId: string, id: string) {
    const media = await this.prisma.media.findFirst({ where: { id, userId } });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async updateMedia(
    userId: string,
    id: string,
    dto: { alt?: string; caption?: string },
  ) {
    await this.getById(userId, id);

    return this.prisma.media.update({
      where: { id },
      data: { alt: dto.alt, caption: dto.caption },
    });
  }

  async deleteMedia(userId: string, id: string) {
    const media = await this.prisma.media.findFirst({
      where: { id, userId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    try {
      await cloudinary.uploader.destroy(media.key, {
        resource_type: this.getResourceType(media.mimeType),
        invalidate: true,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete file',
      );
    }

    await this.prisma.media.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  }

  /**
   * Streams a Multer memory buffer to Cloudinary. resource_type 'auto' lets
   * Cloudinary detect images vs. PDFs; both are stored under the 'image'
   * resource type so the persisted public_id has no extension to reconstruct.
   */
  private uploadToCloudinary(
    buffer: Buffer,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(new Error(error.message || 'Cloudinary upload failed'));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary upload returned no result'));
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(buffer);
    });
  }

  private validateFile(file: Express.Multer.File) {
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }
  }

  private getMediaType(mimeType: string) {
    if (mimeType.startsWith('image/')) {
      return 'IMAGE';
    }

    return 'FILE';
  }

  /**
   * Cloudinary resource_type used when destroying an asset. Derived from the
   * stored mimeType so we never need to persist it: images and PDFs are both
   * uploaded under the 'image' resource type (Cloudinary rasterizes PDFs),
   * anything else falls back to 'raw'.
   */
  private getResourceType(mimeType: string): 'image' | 'raw' {
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      return 'image';
    }

    return 'raw';
  }

  async validateOwnedMedia(mediaId: string, userId: string) {
    const media = await this.prisma.media.findFirst({
      where: {
        id: mediaId,
        userId,
      },
    });

    if (!media) {
      throw new BadRequestException('Invalid media reference');
    }

    return media;
  }

  async validateOwnedMediaList(mediaIds: string[], userId: string) {
    const media = await this.prisma.media.findMany({
      where: {
        id: {
          in: mediaIds,
        },
        userId,
      },
    });

    if (media.length !== mediaIds.length) {
      throw new BadRequestException('Some media files are invalid');
    }

    return media;
  }
}
