import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExperienceDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  company: string;

  @ApiProperty({ example: 'Senior Backend Engineer' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiPropertyOptional({ example: 'Cairo, Egypt' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '2022-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiPropertyOptional({
    example: ['Built REST APIs with NestJS', 'Reduced query time by 40%'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bullets?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
