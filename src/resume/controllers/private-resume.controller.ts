import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';

import { GetUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUser } from 'src/auth/types/current-user.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PRIVATE_API_PREFIX } from 'src/common/constants/routes.constant';

import { CreateResumeSectionDto } from '../dto/create-resume-section.dto';
import { UpdateResumeDto } from '../dto/update-resume.dto';
import { ResumeService } from '../resume.service';

@UseGuards(JwtAuthGuard)
@Controller({
  path: PRIVATE_API_PREFIX,
  version: '1',
})
export class PrivateResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Patch('resume')
  update(@Body() dto: UpdateResumeDto, @GetUser() user: CurrentUser) {
    return this.resumeService.updateResume(dto, user.id);
  }

  @Post('resume/sections')
  createSection(
    @Body() dto: CreateResumeSectionDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.resumeService.createResumeSection(dto, user.id);
  }
}
