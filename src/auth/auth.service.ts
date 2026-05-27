import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,

    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(user.id, user.email);

    return {
      accessToken,

      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  /*
    |--------------------------------------------------------------------------
    | Generate Access Token
    |--------------------------------------------------------------------------
  */

  async generateAccessToken(userId: string, email: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
    });
  }
}
