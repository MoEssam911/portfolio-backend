import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUser } from 'src/auth/types/current-user.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PRIVATE_API_PREFIX } from 'src/common/constants/routes.constant';

import { CreateTestimonialDto } from '../dto/create-testimonial.dto';
import { ReorderTestimonialsDto } from '../dto/reorder-testimonials.dto';
import { UpdateTestimonialDto } from '../dto/update-testimonial.dto';
import { TestimonialsService } from '../testimonials.service';

@ApiTags('Testimonials (Dashboard)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: PRIVATE_API_PREFIX, version: '1' })
export class PrivateTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get('testimonials')
  getAll(@GetUser() user: CurrentUser) {
    return this.testimonialsService.getAll(user.id);
  }

  @Get('testimonials/:id')
  getOne(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.testimonialsService.getOne(user.id, id);
  }

  @Post('testimonials')
  create(@GetUser() user: CurrentUser, @Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(user.id, dto);
  }

  @Patch('testimonials/reorder')
  reorder(@GetUser() user: CurrentUser, @Body() dto: ReorderTestimonialsDto) {
    return this.testimonialsService.reorder(user.id, dto);
  }

  @Patch('testimonials/:id')
  update(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTestimonialDto,
  ) {
    return this.testimonialsService.update(user.id, id, dto);
  }

  @Delete('testimonials/:id')
  remove(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.testimonialsService.remove(user.id, id);
  }
}
