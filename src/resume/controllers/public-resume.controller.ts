import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ResumeService } from '../resume.service';

@ApiTags('Resume')
@Controller({ path: 'resume', version: '1' })
export class PublicResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get()
  get() {
    return this.resumeService.getPublicProfile();
  }
}
