import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateCertificationDto } from './dto/create-certification.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { CreateResumeLinkDto } from './dto/create-resume-link.dto';
import { CreateSkillGroupDto } from './dto/create-skill-group.dto';
import { ReorderDto } from './dto/reorder.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateResumeLinkDto } from './dto/update-resume-link.dto';
import { UpdateResumeProfileDto } from './dto/update-resume-profile.dto';
import { UpdateSkillGroupDto } from './dto/update-skill-group.dto';

const fullProfileIncludes = {
  experiences: { orderBy: { order: 'asc' as const } },
  educations: { orderBy: { order: 'asc' as const } },
  skillGroups: { orderBy: { order: 'asc' as const } },
  certifications: { orderBy: { order: 'asc' as const } },
  links: { orderBy: { order: 'asc' as const } },
} as const;

@Injectable()
export class ResumeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Profile ────────────────────────────────────────────────────────────────

  async getPublicProfile() {
    const profile = await this.prisma.resumeProfile.findFirst({
      include: fullProfileIncludes,
    });

    if (!profile) {
      throw new NotFoundException('Resume not found');
    }

    return profile;
  }

  async getOwnerProfile(userId: string) {
    return this.prisma.resumeProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: fullProfileIncludes,
    });
  }

  async updateProfile(userId: string, dto: UpdateResumeProfileDto) {
    await this.ensureProfileExists(userId);

    return this.prisma.resumeProfile.update({
      where: { userId },
      data: {
        headline: dto.headline,
        summary: dto.summary,
        location: dto.location,
        downloadUrl: dto.downloadUrl,
      },
      include: fullProfileIncludes,
    });
  }

  // ─── Experiences ────────────────────────────────────────────────────────────

  async createExperience(userId: string, dto: CreateExperienceDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.experience.create({
      data: {
        profileId: profile.id,
        company: dto.company,
        title: dto.title,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        current: dto.current ?? false,
        bullets: dto.bullets ?? [],
        order: dto.order ?? 0,
      },
    });
  }

  async updateExperience(userId: string, id: string, dto: UpdateExperienceDto) {
    await this.assertExperienceOwnership(userId, id);

    return this.prisma.experience.update({
      where: { id },
      data: {
        company: dto.company,
        title: dto.title,
        location: dto.location,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        current: dto.current,
        bullets: dto.bullets,
        order: dto.order,
      },
    });
  }

  async deleteExperience(userId: string, id: string) {
    await this.assertExperienceOwnership(userId, id);

    return this.prisma.experience.delete({ where: { id } });
  }

  async reorderExperiences(userId: string, dto: ReorderDto) {
    await this.ensureProfileExists(userId);

    await this.prisma.$transaction(
      dto.items.map(({ id, order }) =>
        this.prisma.experience.update({ where: { id }, data: { order } }),
      ),
    );
  }

  // ─── Education ──────────────────────────────────────────────────────────────

  async createEducation(userId: string, dto: CreateEducationDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.education.create({
      data: {
        profileId: profile.id,
        school: dto.school,
        degree: dto.degree,
        field: dto.field,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        current: dto.current ?? false,
        description: dto.description,
        order: dto.order ?? 0,
      },
    });
  }

  async updateEducation(userId: string, id: string, dto: UpdateEducationDto) {
    await this.assertEducationOwnership(userId, id);

    return this.prisma.education.update({
      where: { id },
      data: {
        school: dto.school,
        degree: dto.degree,
        field: dto.field,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        current: dto.current,
        description: dto.description,
        order: dto.order,
      },
    });
  }

  async deleteEducation(userId: string, id: string) {
    await this.assertEducationOwnership(userId, id);

    return this.prisma.education.delete({ where: { id } });
  }

  async reorderEducations(userId: string, dto: ReorderDto) {
    await this.ensureProfileExists(userId);

    await this.prisma.$transaction(
      dto.items.map(({ id, order }) =>
        this.prisma.education.update({ where: { id }, data: { order } }),
      ),
    );
  }

  // ─── Skill Groups ───────────────────────────────────────────────────────────

  async createSkillGroup(userId: string, dto: CreateSkillGroupDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.skillGroup.create({
      data: {
        profileId: profile.id,
        name: dto.name,
        skills: dto.skills,
        order: dto.order ?? 0,
      },
    });
  }

  async updateSkillGroup(userId: string, id: string, dto: UpdateSkillGroupDto) {
    await this.assertSkillGroupOwnership(userId, id);

    return this.prisma.skillGroup.update({
      where: { id },
      data: {
        name: dto.name,
        skills: dto.skills,
        order: dto.order,
      },
    });
  }

  async deleteSkillGroup(userId: string, id: string) {
    await this.assertSkillGroupOwnership(userId, id);

    return this.prisma.skillGroup.delete({ where: { id } });
  }

  async reorderSkillGroups(userId: string, dto: ReorderDto) {
    await this.ensureProfileExists(userId);

    await this.prisma.$transaction(
      dto.items.map(({ id, order }) =>
        this.prisma.skillGroup.update({ where: { id }, data: { order } }),
      ),
    );
  }

  // ─── Certifications ─────────────────────────────────────────────────────────

  async createCertification(userId: string, dto: CreateCertificationDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.certification.create({
      data: {
        profileId: profile.id,
        name: dto.name,
        issuer: dto.issuer,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        url: dto.url,
        order: dto.order ?? 0,
      },
    });
  }

  async updateCertification(userId: string, id: string, dto: UpdateCertificationDto) {
    await this.assertCertificationOwnership(userId, id);

    return this.prisma.certification.update({
      where: { id },
      data: {
        name: dto.name,
        issuer: dto.issuer,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        url: dto.url,
        order: dto.order,
      },
    });
  }

  async deleteCertification(userId: string, id: string) {
    await this.assertCertificationOwnership(userId, id);

    return this.prisma.certification.delete({ where: { id } });
  }

  async reorderCertifications(userId: string, dto: ReorderDto) {
    await this.ensureProfileExists(userId);

    await this.prisma.$transaction(
      dto.items.map(({ id, order }) =>
        this.prisma.certification.update({ where: { id }, data: { order } }),
      ),
    );
  }

  // ─── Links ──────────────────────────────────────────────────────────────────

  async createLink(userId: string, dto: CreateResumeLinkDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.resumeLink.create({
      data: {
        profileId: profile.id,
        label: dto.label,
        url: dto.url,
        order: dto.order ?? 0,
      },
    });
  }

  async updateLink(userId: string, id: string, dto: UpdateResumeLinkDto) {
    await this.assertLinkOwnership(userId, id);

    return this.prisma.resumeLink.update({
      where: { id },
      data: {
        label: dto.label,
        url: dto.url,
        order: dto.order,
      },
    });
  }

  async deleteLink(userId: string, id: string) {
    await this.assertLinkOwnership(userId, id);

    return this.prisma.resumeLink.delete({ where: { id } });
  }

  async reorderLinks(userId: string, dto: ReorderDto) {
    await this.ensureProfileExists(userId);

    await this.prisma.$transaction(
      dto.items.map(({ id, order }) =>
        this.prisma.resumeLink.update({ where: { id }, data: { order } }),
      ),
    );
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async ensureProfileExists(userId: string) {
    return this.prisma.resumeProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private async assertExperienceOwnership(userId: string, id: string) {
    const profile = await this.ensureProfileExists(userId);
    const item = await this.prisma.experience.findUnique({ where: { id } });

    if (!item || item.profileId !== profile.id) {
      throw new NotFoundException('Experience not found');
    }

    return item;
  }

  private async assertEducationOwnership(userId: string, id: string) {
    const profile = await this.ensureProfileExists(userId);
    const item = await this.prisma.education.findUnique({ where: { id } });

    if (!item || item.profileId !== profile.id) {
      throw new NotFoundException('Education not found');
    }

    return item;
  }

  private async assertSkillGroupOwnership(userId: string, id: string) {
    const profile = await this.ensureProfileExists(userId);
    const item = await this.prisma.skillGroup.findUnique({ where: { id } });

    if (!item || item.profileId !== profile.id) {
      throw new NotFoundException('Skill group not found');
    }

    return item;
  }

  private async assertCertificationOwnership(userId: string, id: string) {
    const profile = await this.ensureProfileExists(userId);
    const item = await this.prisma.certification.findUnique({ where: { id } });

    if (!item || item.profileId !== profile.id) {
      throw new NotFoundException('Certification not found');
    }

    return item;
  }

  private async assertLinkOwnership(userId: string, id: string) {
    const profile = await this.ensureProfileExists(userId);
    const item = await this.prisma.resumeLink.findUnique({ where: { id } });

    if (!item || item.profileId !== profile.id) {
      throw new NotFoundException('Link not found');
    }

    return item;
  }
}
