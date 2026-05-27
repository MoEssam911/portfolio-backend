import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  @MinLength(20)
  description: string;

  @IsOptional()
  @IsUrl()
  liveUrl?: string;

  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  thumbnailId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageIds?: string[];
}
