import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class ReorderItem {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderTestimonialsDto {
  @ApiProperty({ type: [ReorderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}
