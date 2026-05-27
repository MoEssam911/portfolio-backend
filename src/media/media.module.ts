import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';

import { PrivateMediaController } from './controllers/private-media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [PrivateMediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}