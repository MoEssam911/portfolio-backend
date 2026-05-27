import { Controller, Get } from '@nestjs/common';

import { ResumeService } from '../resume.service';

@Controller({
  path: '',
  version: '1',
})
export class PublicResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get('resume')
  findOne() {
    return this.resumeService.getPublicResume();
  }
}
