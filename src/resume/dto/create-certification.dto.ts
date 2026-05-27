import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCertificationDto {
  @ApiProperty({ example: 'AWS Certified Developer' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Amazon Web Services' })
  @IsString()
  @MinLength(2)
  issuer: string;

  @ApiPropertyOptional({ example: '2023-03-15' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-03-15' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://aws.amazon.com/verify/abc' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
