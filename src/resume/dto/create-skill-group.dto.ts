import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSkillGroupDto {
  @ApiProperty({ example: 'Languages' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: ['TypeScript', 'Go', 'SQL'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  skills: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
