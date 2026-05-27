import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class CreateResumeLinkDto {
  @ApiProperty({ example: 'GitHub' })
  @IsString()
  @MinLength(1)
  label: string;

  @ApiProperty({ example: 'https://github.com/me' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
