import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBlogDto {
  @ApiProperty({ example: 'My First Blog Post' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiPropertyOptional({ example: 'A short summary of the post' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ example: '# Hello World\n\nThis is my post content...' })
  @IsString()
  @MinLength(20)
  content: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: 'clxyz123' })
  @IsOptional()
  @IsString()
  coverImageId?: string;

  @ApiPropertyOptional({ example: ['nestjs', 'typescript'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
