import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEducationDto {
  @ApiProperty({ example: 'Cairo University' })
  @IsString()
  @MinLength(2)
  school: string;

  @ApiProperty({ example: 'B.Sc. Computer Science' })
  @IsString()
  @MinLength(2)
  degree: string;

  @ApiPropertyOptional({ example: 'Software Engineering' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({ example: '2018-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2022-06-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiPropertyOptional({ example: 'Graduated with honors' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
