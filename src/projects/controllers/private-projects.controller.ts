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

import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectsService } from '../projects.service';

@UseGuards(JwtAuthGuard)
@Controller({
  path: PRIVATE_API_PREFIX,
  version: '1',
})
export class PrivateProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  findAll(@Query() query: PaginationQueryDto) {
    return this.projectsService.findAllPrivate(query);
  }

  @Get('projects/:slug')
  findOne(@Param('slug') slug: string) {
    return this.projectsService.findOnePrivate(slug);
  }

  @Post('projects')
  create(@Body() dto: CreateProjectDto, @GetUser() user: CurrentUser) {
    return this.projectsService.createProject(dto, user.id);
  }

  @Patch('projects/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.projectsService.updateProject(id, dto, user.id);
  }

  @Delete('projects/:id')
  remove(@Param('id') id: string, @GetUser() user: CurrentUser) {
    return this.projectsService.deleteProject(id, user.id);
  }
}
