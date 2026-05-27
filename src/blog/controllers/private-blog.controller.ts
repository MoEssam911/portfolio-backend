import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { GetUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUser } from 'src/auth/types/current-user.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PRIVATE_API_PREFIX } from 'src/common/constants/routes.constant';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

import { BlogService } from '../blog.service';
import { CreateBlogDto } from '../dto/create-blog.dto';
import { UpdateBlogDto } from '../dto/update-blog.dto';

@UseGuards(JwtAuthGuard)
@Controller({
  path: PRIVATE_API_PREFIX,
  version: '1',
})
export class PrivateBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('blogs')
  findAll(@Query() query: PaginationQueryDto) {
    return this.blogService.findAllPrivate(query);
  }

  @Get('blogs/:slug')
  findOne(@Param('slug') slug: string) {
    return this.blogService.findOnePrivate(slug);
  }

  @Post('blogs')
  create(@Body() dto: CreateBlogDto, @GetUser() user: CurrentUser) {
    return this.blogService.createBlog(dto, user.id);
  }

  @Patch('blogs/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlogDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.blogService.updateBlog(id, dto, user.id);
  }

  @Delete('blogs/:id')
  remove(@Param('id') id: string, @GetUser() user: CurrentUser) {
    return this.blogService.deleteBlog(id, user.id);
  }
}
