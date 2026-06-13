import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Portfolio API' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({
    example: 'A NestJS-powered personal portfolio backend',
  })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({
    example: 'Full description of the project goals and architecture...',
  })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiPropertyOptional({ example: 'https://mysite.com' })
  @IsOptional()
  @IsUrl()
  liveUrl?: string;

  @ApiPropertyOptional({ example: 'https://github.com/me/repo' })
  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: 'clxyz123' })
  @IsOptional()
  @IsString()
  thumbnailId?: string;

  @ApiPropertyOptional({ example: ['clxyz456', 'clxyz789'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageIds?: string[];

  @ApiPropertyOptional({
    example: ['NestJS', 'Prisma', 'PostgreSQL'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];
}
