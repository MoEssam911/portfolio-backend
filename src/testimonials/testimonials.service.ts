import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { MediaService } from 'src/media/media.service';

import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { ReorderTestimonialsDto } from './dto/reorder-testimonials.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

const testimonialIncludes = {
  avatar: true,
} as const;

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  getPublished() {
    return this.prisma.testimonial.findMany({
      where: { published: true },
      include: testimonialIncludes,
      orderBy: { order: 'asc' },
    });
  }

  getAll(userId: string) {
    return this.prisma.testimonial.findMany({
      where: { userId },
      include: testimonialIncludes,
      orderBy: { order: 'asc' },
    });
  }

  async getOne(userId: string, id: string) {
    const testimonial = await this.prisma.testimonial.findFirst({
      where: { id, userId },
      include: testimonialIncludes,
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return testimonial;
  }

  async create(userId: string, dto: CreateTestimonialDto) {
    if (dto.avatarId) {
      await this.mediaService.validateOwnedMedia(dto.avatarId, userId);
    }

    return this.prisma.testimonial.create({
      data: {
        userId,
        name: dto.name,
        role: dto.role,
        company: dto.company,
        quote: dto.quote,
        avatarId: dto.avatarId,
        featured: dto.featured ?? false,
        published: dto.published ?? false,
      },
      include: testimonialIncludes,
    });
  }

  async update(userId: string, id: string, dto: UpdateTestimonialDto) {
    await this.getOne(userId, id);

    if (dto.avatarId) {
      await this.mediaService.validateOwnedMedia(dto.avatarId, userId);
    }

    return this.prisma.testimonial.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        company: dto.company,
        quote: dto.quote,
        avatarId: dto.avatarId,
        featured: dto.featured,
        published: dto.published,
      },
      include: testimonialIncludes,
    });
  }

  async remove(userId: string, id: string) {
    await this.getOne(userId, id);

    await this.prisma.testimonial.delete({ where: { id } });

    return { success: true };
  }

  async reorder(userId: string, dto: ReorderTestimonialsDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.testimonial.update({
          where: { id: item.id, userId },
          data: { order: item.order },
        }),
      ),
    );

    return { success: true };
  }
}
