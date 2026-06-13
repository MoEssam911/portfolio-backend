import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  /*
    |--------------------------------------------------------------------------
    | Proxy
    |--------------------------------------------------------------------------
    | Render terminates TLS at its edge proxy. Trust the first proxy hop so
    | req.ip (used by the throttler) and req.protocol reflect the real client.
  */

  app.set('trust proxy', 1);

  /*
    |--------------------------------------------------------------------------
    | Security
    |--------------------------------------------------------------------------
  */

  app.use(helmet());

  app.enableCors({
    origin: configService.get<string[]>('app.allowedOrigins'),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

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

  /*
    |--------------------------------------------------------------------------
    | Swagger (development only)
    |--------------------------------------------------------------------------
  */

  if (configService.get<string>('app.env') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Portfolio API')
      .setDescription('Mohamed Essam — personal portfolio & CMS API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Bind to 0.0.0.0 so Render's proxy can reach the container on the injected PORT.
  await app.listen(configService.get<number>('app.port', 4000), '0.0.0.0');
}

void bootstrap();
