import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SkillItemDto {
  @ApiProperty({ example: 'TypeScript' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'logos:typescript-icon' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;
}

export class CreateSkillGroupDto {
  @ApiProperty({ example: 'Languages' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'lucide:code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({ type: [SkillItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SkillItemDto)
  skills: SkillItemDto[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
