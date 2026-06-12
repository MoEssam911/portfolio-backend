import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { BlogModule } from './blog/blog.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResumeModule } from './resume/resume.module';
import { ProjectsModule } from './projects/projects.module';
import { SettingsModule } from './settings/settings.module';
import { MediaModule } from './media/media.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { ServicesModule } from './services/services.module';
import { ContactModule } from './contact/contact.module';

import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import supabaseConfig from './config/supabase.config';
import mailConfig from './config/mail.config';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, supabaseConfig, mailConfig],
      validationSchema: envValidationSchema,
    }),

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),

    PrismaModule,
    BlogModule,
    AuthModule,
    ResumeModule,
    ProjectsModule,
    SettingsModule,
    MediaModule,
    TestimonialsModule,
    ServicesModule,
    ContactModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
