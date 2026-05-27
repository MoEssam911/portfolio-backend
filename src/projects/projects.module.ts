import { Module } from '@nestjs/common';

import { MediaModule } from 'src/media/media.module';

import { PrivateProjectsController } from './controllers/private-projects.controller';
import { PublicProjectsController } from './controllers/public-projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [MediaModule],
  controllers: [PublicProjectsController, PrivateProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
