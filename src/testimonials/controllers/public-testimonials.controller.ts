import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { TestimonialsService } from '../testimonials.service';

@ApiTags('Testimonials')
@Controller({ path: 'testimonials', version: '1' })
export class PublicTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  getAll() {
    return this.testimonialsService.getPublished();
  }
}
