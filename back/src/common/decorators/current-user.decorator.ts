import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedActor } from '@kernel/domain/actor-id';

/**
 * L'appelant, et la seule source d'identité légitime dans un controller.
 *
 * Le `userId` rendu est un `ActorId` : un `string` venant d'un `@Param`, d'un
 * `@Body` ou d'une `@Query` ne peut pas prendre sa place dans un DTO de use-case.
 */
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext): AuthenticatedActor => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedActor;
  },
);
