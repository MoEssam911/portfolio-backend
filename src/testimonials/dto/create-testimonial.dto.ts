import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Engineering Manager' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  role: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @ApiProperty({
    example:
      'Mohamed delivered the project ahead of schedule and the code quality was exceptional.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  quote: string;

  @ApiPropertyOptional({ example: 'clxyz123' })
  @IsString()
  @IsOptional()
  avatarId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
