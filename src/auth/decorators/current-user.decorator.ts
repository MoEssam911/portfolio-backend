import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { CurrentUser } from '../types/current-user.type';

interface AuthenticatedRequest extends Request {
  user: CurrentUser;
}

export const GetUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
