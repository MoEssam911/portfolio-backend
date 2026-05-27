import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

import { BlogService } from '../blog.service';

@ApiTags('Blog')
@Controller({
  path: '',
  version: '1',
})
export class PublicBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('blogs')
  findAll(@Query() query: PaginationQueryDto) {
    return this.blogService.getPublicBlogs(query);
  }

  @Get('blogs/:slug')
  findOne(@Param('slug') slug: string) {
    return this.blogService.getPublicBlogBySlug(slug);
  }
}
