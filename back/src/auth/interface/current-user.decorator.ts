import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as TokenPayload;
  },
);
