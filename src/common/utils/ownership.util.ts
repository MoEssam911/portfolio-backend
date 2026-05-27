import { ForbiddenException } from '@nestjs/common';

export function assertOwnership(
  resourceUserId: string | null | undefined,
  currentUserId: string,
  resourceName = 'resource',
) {
  if (resourceUserId !== currentUserId) {
    throw new ForbiddenException(`You do not own this ${resourceName}`);
  }
}
