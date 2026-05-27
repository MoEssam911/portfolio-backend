import { Module } from '@nestjs/common';

import { PrivateServicesController } from './controllers/private-services.controller';
import { PublicServicesController } from './controllers/public-services.controller';
import { ServicesService } from './services.service';

@Module({
  controllers: [PublicServicesController, PrivateServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
