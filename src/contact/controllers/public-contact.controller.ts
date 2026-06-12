import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { ContactService } from '../contact.service';
import { CreateContactDto } from '../dto/create-contact.dto';

@ApiTags('Contact')
@Controller({ path: 'contact', version: '1' })
export class PublicContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({ summary: 'Submit the public contact form' })
  // Stricter than the global 100/60s — a contact form should not be hammered.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @Post()
  submit(@Body() dto: CreateContactDto) {
    return this.contactService.submit(dto);
  }
}
