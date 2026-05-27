import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),

        signOptions: {
          expiresIn: configService.getOrThrow<string>('jwt.expiresIn') as StringValue,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
