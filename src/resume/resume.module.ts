import { Module } from '@nestjs/common';

import { PrivateResumeController } from './controllers/private-resume.controller';
import { PublicResumeController } from './controllers/public-resume.controller';
import { ResumeService } from './resume.service';

@Module({
  controllers: [PublicResumeController, PrivateResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
