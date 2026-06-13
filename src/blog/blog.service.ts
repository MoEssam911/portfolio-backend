import { Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { buildPaginationMeta } from 'src/common/utils/pagination.util';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { assertOwnership } from 'src/common/utils/ownership.util';
import { MediaService } from 'src/media/media.service';

const blogIncludes = {
  coverImage: true,
  tags: true,
} as const;

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  private buildTagsConnect(names: string[]) {
    return names.map((name) => ({
      where: { slug: slugify(name, { lower: true, strict: true }) },
      create: { name, slug: slugify(name, { lower: true, strict: true }) },
    }));
  }

  private async assertBlogOwnership(blogId: string, userId: string) {
    const blog = await this.prisma.blogPost.findUnique({
      where: {
        id: blogId,
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    assertOwnership(blog.userId, userId, 'blog');

    return blog;
  }

  async createBlog(dto: CreateBlogDto, userId: string) {
    if (dto.coverImageId) {
      await this.mediaService.validateOwnedMedia(dto.coverImageId, userId);
    }

    const slug = slugify(dto.title, {
      lower: true,
      strict: true,
    });

    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        published: dto.published ?? false,
        coverImageId: dto.coverImageId,
        userId,
        tags: dto.tags?.length
          ? { connectOrCreate: this.buildTagsConnect(dto.tags) }
          : undefined,
      },
      include: blogIncludes,
    });
  }

  async updateBlog(id: string, dto: UpdateBlogDto, userId: string) {
    await this.assertBlogOwnership(id, userId);

    if (dto.coverImageId) {
      await this.mediaService.validateOwnedMedia(dto.coverImageId, userId);
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.title
          ? slugify(dto.title, { lower: true, strict: true })
          : undefined,
        excerpt: dto.excerpt,
        content: dto.content,
        published: dto.published,
        coverImageId: dto.coverImageId,
        tags:
          dto.tags !== undefined
            ? { set: [], connectOrCreate: this.buildTagsConnect(dto.tags) }
            : undefined,
      },
      include: blogIncludes,
    });
  }

  async deleteBlog(id: string, userId: string) {
    await this.assertBlogOwnership(id, userId);

    return this.prisma.blogPost.delete({ where: { id } });
  }

  async getPublicBlogs(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: {
          published: true,
        },

        include: blogIncludes,

        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.blogPost.count({
        where: {
          published: true,
        },
      }),
    ]);

    return {
      data: posts,

      meta: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  }

  async getPublicBlogBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: blogIncludes,
    });

    if (!post || !post.published) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }

  async findAllPrivate(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        skip,
        take: limit,

        include: blogIncludes,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.blogPost.count(),
    ]);

    return {
      data: posts,

      meta: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  }

  async findOnePrivate(slug: string) {
    return this.prisma.blogPost.findUniqueOrThrow({
      where: { slug },
      include: blogIncludes,
    });
  }
}
