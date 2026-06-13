import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'Mohamed Essam' })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  siteTitle?: string;

  @ApiPropertyOptional({ example: 'Backend engineer building cool things' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  siteDescription?: string;

  @ApiPropertyOptional({ example: "Hi, I'm Mohamed" })
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @ApiPropertyOptional({
    example: 'Backend engineer & open source contributor',
  })
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiPropertyOptional({
    example: 'I build backend systems with NestJS and Prisma.',
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: 'https://github.com/me' })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/me' })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'https://x.com/me' })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @ApiPropertyOptional({ example: 'contact@me.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://cdn.me.com/resume.pdf' })
  @IsOptional()
  @IsUrl()
  resumeFileUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  availableForWork?: boolean;
}
