import { PartialType } from '@nestjs/swagger';
import { CreateSkillGroupDto } from './create-skill-group.dto';

export class UpdateSkillGroupDto extends PartialType(CreateSkillGroupDto) {}
