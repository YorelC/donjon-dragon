import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { TokenPayload, TokenTier } from '@donjon-dragon/shared/auth-schema';

export const REQUIRED_TIER_KEY = 'requiredTier';

export const RequireTier = (tier: TokenTier) =>
  Reflect.metadata(REQUIRED_TIER_KEY, tier);

@Injectable()
export class TierGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.get<TokenTier>(
      REQUIRED_TIER_KEY,
      context.getHandler(),
    );

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as TokenPayload;

    if (user.tier !== requiredTier) {
      throw new ForbiddenException(
        `Tier ${requiredTier} required, but user has tier ${user.tier}`,
      );
    }

    return true;
  }
}
