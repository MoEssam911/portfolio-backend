import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings() {
    const settings = await this.prisma.settings.findFirst();

    if (!settings) {
      return null;
    }

    return {
      siteTitle: settings.siteTitle,
      siteDescription: settings.siteDescription,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      about: settings.about,
      githubUrl: settings.githubUrl,
      linkedinUrl: settings.linkedinUrl,
      twitterUrl: settings.twitterUrl,
      contactEmail: settings.contactEmail,
      resumeFileUrl: settings.resumeFileUrl,
      availableForWork: settings.availableForWork,
    };
  }

  async getSettings(userId: string) {
    return this.prisma.settings.findUnique({ where: { userId } });
  }

  async upsertSettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.settings.upsert({
      where: { userId },
      create: {
        userId,
        siteTitle: dto.siteTitle ?? 'My Portfolio',
        siteDescription: dto.siteDescription ?? '',
        heroTitle: dto.heroTitle ?? '',
        heroSubtitle: dto.heroSubtitle ?? '',
        about: dto.about ?? '',
        githubUrl: dto.githubUrl,
        linkedinUrl: dto.linkedinUrl,
        twitterUrl: dto.twitterUrl,
        contactEmail: dto.contactEmail ?? '',
        resumeFileUrl: dto.resumeFileUrl,
        availableForWork: dto.availableForWork ?? true,
      },
      update: {
        siteTitle: dto.siteTitle,
        siteDescription: dto.siteDescription,
        heroTitle: dto.heroTitle,
        heroSubtitle: dto.heroSubtitle,
        about: dto.about,
        githubUrl: dto.githubUrl,
        linkedinUrl: dto.linkedinUrl,
        twitterUrl: dto.twitterUrl,
        contactEmail: dto.contactEmail,
        resumeFileUrl: dto.resumeFileUrl,
        availableForWork: dto.availableForWork,
      },
    });
  }
}
