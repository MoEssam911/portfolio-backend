import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  @MinLength(20)
  content: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  coverImageId?: string;
}
