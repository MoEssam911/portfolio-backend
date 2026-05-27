import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ServicesService } from '../services.service';

@ApiTags('Services')
@Controller({ path: 'services', version: '1' })
export class PublicServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  getAll() {
    return this.servicesService.getPublished();
  }
}
