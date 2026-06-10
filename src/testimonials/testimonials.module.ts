import { Module } from '@nestjs/common';

import { PrivateTestimonialsController } from './controllers/private-testimonials.controller';
import { PublicTestimonialsController } from './controllers/public-testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [PublicTestimonialsController, PrivateTestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
