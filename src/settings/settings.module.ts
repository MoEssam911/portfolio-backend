import { Module } from '@nestjs/common';

import { PrivateSettingsController } from './controllers/private-settings.controller';
import { PublicSettingsController } from './controllers/public-settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [PublicSettingsController, PrivateSettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
