import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateResumeSectionDto } from './dto/create-resume-section.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumeService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwnedResumeOrThrow(userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: {
        userId,
      },
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async getPublicResume() {
    const resume = await this.prisma.resume.findFirst({
      where: {
        isDefault: true,
      },
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!resume) {
      throw new NotFoundException('Public resume not found');
    }

    return resume;
  }

  async updateResume(dto: UpdateResumeDto, userId: string) {
    const resume = await this.getOwnedResumeOrThrow(userId);

    return this.prisma.resume.update({
      where: {
        id: resume.id,
      },
      data: dto,
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async createResumeSection(dto: CreateResumeSectionDto, userId: string) {
    const resume = await this.getOwnedResumeOrThrow(userId);

    return this.prisma.resumeSection.create({
      data: {
        type: dto.type,
        title: dto.title,
        order: dto.order ?? 0,
        content: dto.content,
        resumeId: resume.id,
      },
    });
  }
}
