import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateServiceDto } from './dto/create-service.dto';
import { ReorderServicesDto } from './dto/reorder-services.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  getPublished() {
    return this.prisma.service.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
  }

  getAll(userId: string) {
    return this.prisma.service.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async getOne(userId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, userId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  create(userId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        priceRange: dto.priceRange,
        icon: dto.icon,
        featured: dto.featured ?? false,
        published: dto.published ?? false,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateServiceDto) {
    await this.getOne(userId, id);

    return this.prisma.service.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priceRange: dto.priceRange,
        icon: dto.icon,
        featured: dto.featured,
        published: dto.published,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.getOne(userId, id);

    await this.prisma.service.delete({ where: { id } });

    return { success: true };
  }

  async reorder(userId: string, dto: ReorderServicesDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.service.update({
          where: { id: item.id, userId },
          data: { order: item.order },
        }),
      ),
    );

    return { success: true };
  }
}
