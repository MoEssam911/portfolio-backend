import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

import { PrismaService } from 'src/prisma/prisma.service';
import { buildPaginationMeta } from 'src/common/utils/pagination.util';
import { randomUUID } from 'crypto';

@Injectable()
export class MediaService {
  private readonly supabase: ReturnType<typeof createClient>;
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.supabase = createClient(
      configService.getOrThrow<string>('supabase.url'),
      configService.getOrThrow<string>('supabase.serviceRoleKey'),
    );

    this.bucket = configService.getOrThrow<string>('supabase.bucket');
  }

  async uploadFile(userId: string, file: Express.Multer.File) {
    this.validateFile(file);

    const fileExtension = file.originalname.split('.').pop();

    const key = `media/${userId}/${randomUUID()}.${fileExtension}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(key);

    return this.prisma.media.create({
      data: {
        userId,
        key,
        url: data.publicUrl,
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

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([media.key]);

    if (error) {
      throw new BadRequestException(error.message);
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
