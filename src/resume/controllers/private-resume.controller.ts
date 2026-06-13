import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUser } from 'src/auth/types/current-user.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PRIVATE_API_PREFIX } from 'src/common/constants/routes.constant';

import { CreateCertificationDto } from '../dto/create-certification.dto';
import { CreateEducationDto } from '../dto/create-education.dto';
import { CreateExperienceDto } from '../dto/create-experience.dto';
import { CreateResumeLinkDto } from '../dto/create-resume-link.dto';
import { CreateSkillGroupDto } from '../dto/create-skill-group.dto';
import { ReorderDto } from '../dto/reorder.dto';
import { UpdateCertificationDto } from '../dto/update-certification.dto';
import { UpdateEducationDto } from '../dto/update-education.dto';
import { UpdateExperienceDto } from '../dto/update-experience.dto';
import { UpdateResumeLinkDto } from '../dto/update-resume-link.dto';
import { UpdateResumeProfileDto } from '../dto/update-resume-profile.dto';
import { UpdateSkillGroupDto } from '../dto/update-skill-group.dto';
import { ResumeService } from '../resume.service';

@ApiTags('Resume (Dashboard)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: PRIVATE_API_PREFIX, version: '1' })
export class PrivateResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  // ─── Profile ────────────────────────────────────────────────────────────────

  @Get('resume')
  getProfile(@GetUser() user: CurrentUser) {
    return this.resumeService.getOwnerProfile(user.id);
  }

  @Patch('resume')
  updateProfile(
    @GetUser() user: CurrentUser,
    @Body() dto: UpdateResumeProfileDto,
  ) {
    return this.resumeService.updateProfile(user.id, dto);
  }

  // ─── Experiences ────────────────────────────────────────────────────────────

  @Post('resume/experiences')
  createExperience(
    @GetUser() user: CurrentUser,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.resumeService.createExperience(user.id, dto);
  }

  @Patch('resume/experiences/reorder')
  reorderExperiences(@GetUser() user: CurrentUser, @Body() dto: ReorderDto) {
    return this.resumeService.reorderExperiences(user.id, dto);
  }

  @Patch('resume/experiences/:id')
  updateExperience(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.resumeService.updateExperience(user.id, id, dto);
  }

  @Delete('resume/experiences/:id')
  deleteExperience(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.resumeService.deleteExperience(user.id, id);
  }

  // ─── Education ──────────────────────────────────────────────────────────────

  @Post('resume/educations')
  createEducation(
    @GetUser() user: CurrentUser,
    @Body() dto: CreateEducationDto,
  ) {
    return this.resumeService.createEducation(user.id, dto);
  }

  @Patch('resume/educations/reorder')
  reorderEducations(@GetUser() user: CurrentUser, @Body() dto: ReorderDto) {
    return this.resumeService.reorderEducations(user.id, dto);
  }

  @Patch('resume/educations/:id')
  updateEducation(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.resumeService.updateEducation(user.id, id, dto);
  }

  @Delete('resume/educations/:id')
  deleteEducation(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.resumeService.deleteEducation(user.id, id);
  }

  // ─── Skill Groups ───────────────────────────────────────────────────────────

  @Post('resume/skill-groups')
  createSkillGroup(
    @GetUser() user: CurrentUser,
    @Body() dto: CreateSkillGroupDto,
  ) {
    return this.resumeService.createSkillGroup(user.id, dto);
  }

  @Patch('resume/skill-groups/reorder')
  reorderSkillGroups(@GetUser() user: CurrentUser, @Body() dto: ReorderDto) {
    return this.resumeService.reorderSkillGroups(user.id, dto);
  }

  @Patch('resume/skill-groups/:id')
  updateSkillGroup(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateSkillGroupDto,
  ) {
    return this.resumeService.updateSkillGroup(user.id, id, dto);
  }

  @Delete('resume/skill-groups/:id')
  deleteSkillGroup(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.resumeService.deleteSkillGroup(user.id, id);
  }

  // ─── Certifications ─────────────────────────────────────────────────────────

  @Post('resume/certifications')
  createCertification(
    @GetUser() user: CurrentUser,
    @Body() dto: CreateCertificationDto,
  ) {
    return this.resumeService.createCertification(user.id, dto);
  }

  @Patch('resume/certifications/reorder')
  reorderCertifications(@GetUser() user: CurrentUser, @Body() dto: ReorderDto) {
    return this.resumeService.reorderCertifications(user.id, dto);
  }

  @Patch('resume/certifications/:id')
  updateCertification(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.resumeService.updateCertification(user.id, id, dto);
  }

  @Delete('resume/certifications/:id')
  deleteCertification(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.resumeService.deleteCertification(user.id, id);
  }

  // ─── Links ──────────────────────────────────────────────────────────────────

  @Post('resume/links')
  createLink(@GetUser() user: CurrentUser, @Body() dto: CreateResumeLinkDto) {
    return this.resumeService.createLink(user.id, dto);
  }

  @Patch('resume/links/reorder')
  reorderLinks(@GetUser() user: CurrentUser, @Body() dto: ReorderDto) {
    return this.resumeService.reorderLinks(user.id, dto);
  }

  @Patch('resume/links/:id')
  updateLink(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateResumeLinkDto,
  ) {
    return this.resumeService.updateLink(user.id, id, dto);
  }

  @Delete('resume/links/:id')
  deleteLink(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.resumeService.deleteLink(user.id, id);
  }
}
