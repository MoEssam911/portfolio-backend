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

import { CreateServiceDto } from '../dto/create-service.dto';
import { ReorderServicesDto } from '../dto/reorder-services.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServicesService } from '../services.service';

@ApiTags('Services (Dashboard)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: PRIVATE_API_PREFIX, version: '1' })
export class PrivateServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('services')
  getAll(@GetUser() user: CurrentUser) {
    return this.servicesService.getAll(user.id);
  }

  @Get('services/:id')
  getOne(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.servicesService.getOne(user.id, id);
  }

  @Post('services')
  create(@GetUser() user: CurrentUser, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user.id, dto);
  }

  @Patch('services/reorder')
  reorder(@GetUser() user: CurrentUser, @Body() dto: ReorderServicesDto) {
    return this.servicesService.reorder(user.id, dto);
  }

  @Patch('services/:id')
  update(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(user.id, id, dto);
  }

  @Delete('services/:id')
  remove(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.servicesService.remove(user.id, id);
  }
}
