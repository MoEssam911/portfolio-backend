import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  /*
    |--------------------------------------------------------------------------
    | Global Prefix
    |--------------------------------------------------------------------------
  */

  app.setGlobalPrefix('api');

  /*
    |--------------------------------------------------------------------------
    | API Versioning
    |--------------------------------------------------------------------------
  */

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  /*
    |--------------------------------------------------------------------------
    | Global Validation
    |--------------------------------------------------------------------------
  */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // global filter
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  // global interceptor
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  await app.listen(configService.get<number>('app.port', 4000));
}

void bootstrap();
