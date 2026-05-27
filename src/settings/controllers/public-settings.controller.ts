import { Controller, Get } from '@nestjs/common';

import { SettingsService } from '../settings.service';

@Controller({ path: 'settings', version: '1' })
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getPublic() {
    return this.settingsService.getPublicSettings();
  }
}
