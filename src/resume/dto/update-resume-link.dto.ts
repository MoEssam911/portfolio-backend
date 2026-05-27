import { PartialType } from '@nestjs/swagger';
import { CreateResumeLinkDto } from './create-resume-link.dto';

export class UpdateResumeLinkDto extends PartialType(CreateResumeLinkDto) {}
