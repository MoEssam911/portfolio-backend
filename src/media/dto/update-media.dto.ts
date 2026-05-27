import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({ example: 'Screenshot of the dashboard' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({ example: 'Portfolio project — dark mode view' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
