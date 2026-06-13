import { Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildPaginationMeta } from 'src/common/utils/pagination.util';
import { assertOwnership } from 'src/common/utils/ownership.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { MediaService } from 'src/media/media.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const projectIncludes = {
  thumbnail: true,
  gallery: {
    include: { media: true },
    orderBy: { order: 'asc' as const },
  },
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  private async assertProjectOwnership(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    assertOwnership(project.userId, userId, 'project');

    return project;
  }

  async createProject(dto: CreateProjectDto, userId: string) {
    if (dto.thumbnailId) {
      await this.mediaService.validateOwnedMedia(dto.thumbnailId, userId);
    }

    if (dto.galleryImageIds?.length) {
      await this.mediaService.validateOwnedMediaList(
        dto.galleryImageIds,
        userId,
      );
    }

    const slug = slugify(dto.title, { lower: true, strict: true });

    return this.prisma.project.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        description: dto.description,
        liveUrl: dto.liveUrl,
        repoUrl: dto.repoUrl,
        featured: dto.featured ?? false,
        published: dto.published ?? false,
        technologies: dto.technologies ?? [],
        thumbnailId: dto.thumbnailId,
        userId,
        gallery: dto.galleryImageIds?.length
          ? {
              create: dto.galleryImageIds.map((mediaId, index) => ({
                mediaId,
                order: index,
              })),
            }
          : undefined,
      },
      include: projectIncludes,
    });
  }

  async updateProject(id: string, dto: UpdateProjectDto, userId: string) {
    await this.assertProjectOwnership(id, userId);

    if (dto.thumbnailId) {
      await this.mediaService.validateOwnedMedia(dto.thumbnailId, userId);
    }

    if (dto.galleryImageIds?.length) {
      await this.mediaService.validateOwnedMediaList(
        dto.galleryImageIds,
        userId,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.galleryImageIds !== undefined) {
        await tx.projectGalleryImage.deleteMany({ where: { projectId: id } });
      }

      return tx.project.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.title
            ? slugify(dto.title, { lower: true, strict: true })
            : undefined,
          excerpt: dto.excerpt,
          description: dto.description,
          liveUrl: dto.liveUrl,
          repoUrl: dto.repoUrl,
          featured: dto.featured,
          published: dto.published,
          technologies: dto.technologies,
          thumbnailId: dto.thumbnailId,
          gallery: dto.galleryImageIds?.length
            ? {
                create: dto.galleryImageIds.map((mediaId, index) => ({
                  mediaId,
                  order: index,
                })),
              }
            : undefined,
        },
        include: projectIncludes,
      });
    });
  }

  async deleteProject(id: string, userId: string) {
    await this.assertProjectOwnership(id, userId);

    return this.prisma.project.delete({ where: { id } });
  }

  async getPublicProjects(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { published: true },
        skip,
        take: limit,
        include: projectIncludes,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.project.count({ where: { published: true } }),
    ]);

    return {
      data: projects,
      meta: buildPaginationMeta({ page, limit, total }),
    };
  }

  async getPublicProjectBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: projectIncludes,
    });

    if (!project || !project.published) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async findAllPrivate(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take: limit,
        include: projectIncludes,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.project.count(),
    ]);

    return {
      data: projects,
      meta: buildPaginationMeta({ page, limit, total }),
    };
  }

  async findOnePrivate(slug: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { slug },
      include: projectIncludes,
    });
  }
}
