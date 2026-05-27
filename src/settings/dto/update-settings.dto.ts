import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(70)
  siteTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  siteDescription?: string;

  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUrl()
  resumeFileUrl?: string;

  @IsOptional()
  @IsBoolean()
  availableForWork?: boolean;
}
