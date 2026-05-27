import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateResumeDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
