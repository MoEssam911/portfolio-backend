import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(200)
  email: string;

  @ApiProperty({ example: 'A new project' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  subject: string;

  @ApiProperty({ example: 'Hi Mohamed, I would love to talk about…' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  message: string;
}
