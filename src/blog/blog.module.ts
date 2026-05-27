import { Module } from '@nestjs/common';

import { PrivateBlogController } from './controllers/private-blog.controller';
import { PublicBlogController } from './controllers/public-blog.controller';
import { BlogService } from './blog.service';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [ MediaModule],
  controllers: [PublicBlogController, PrivateBlogController],
  providers: [BlogService],
})
export class BlogModule {}
