import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { GetUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUser } from 'src/auth/types/current-user.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PRIVATE_API_PREFIX } from 'src/common/constants/routes.constant';

import { UpdateSettingsDto } from '../dto/update-settings.dto';
import { SettingsService } from '../settings.service';

@UseGuards(JwtAuthGuard)
@Controller({ path: PRIVATE_API_PREFIX, version: '1' })
export class PrivateSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  get(@GetUser() user: CurrentUser) {
    return this.settingsService.getSettings(user.id);
  }

  @Patch('settings')
  update(@GetUser() user: CurrentUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.upsertSettings(user.id, dto);
  }
}
