import { Module } from '@nestjs/common';

import { ContactService } from './contact.service';
import { PublicContactController } from './controllers/public-contact.controller';
import { MailService } from './mail.service';

@Module({
  controllers: [PublicContactController],
  providers: [ContactService, MailService],
})
export class ContactModule {}
