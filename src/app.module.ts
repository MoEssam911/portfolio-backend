import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BlogModule } from './blog/blog.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResumeModule } from './resume/resume.module';
import { ProjectsModule } from './projects/projects.module';
import { SettingsModule } from './settings/settings.module';
import { MediaModule } from './media/media.module';

import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import supabaseConfig from './config/supabase.config';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      load: [appConfig, jwtConfig, supabaseConfig],

      validationSchema: envValidationSchema,
    }),

    PrismaModule,
    BlogModule,
    AuthModule,
    ResumeModule,
    ProjectsModule,
    SettingsModule,
    MediaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
