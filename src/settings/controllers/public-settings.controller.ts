import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SettingsService } from '../settings.service';

@ApiTags('Settings')
@Controller({ path: 'settings', version: '1' })
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getPublic() {
    return this.settingsService.getPublicSettings();
  }
}
