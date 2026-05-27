import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { Prisma } from '@prisma/client';

import { ResumeSectionType } from '../types/resume-section-type.enum';

export class CreateResumeSectionDto {
  @IsEnum(ResumeSectionType)
  type: ResumeSectionType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsObject()
  content: Prisma.InputJsonValue;
}
