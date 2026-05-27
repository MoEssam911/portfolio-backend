import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

import { ProjectsService } from '../projects.service';

@ApiTags('Projects')
@Controller({
  path: '',
  version: '1',
})
export class PublicProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  findAll(@Query() query: PaginationQueryDto) {
    return this.projectsService.getPublicProjects(query);
  }

  @Get('projects/:slug')
  findOne(@Param('slug') slug: string) {
    return this.projectsService.getPublicProjectBySlug(slug);
  }
}
