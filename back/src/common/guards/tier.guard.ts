import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { TokenTier } from '@donjon-dragon/shared/auth-schema';

export const REQUIRED_TIER_KEY = 'requiredTier';

/**
 * Exige un tier d'access token sur une route. `POST /api/auth/readonly-token`
 * émet des tokens `readonly` : sans ce marqueur sur les routes mutantes, ce
 * tier n'était contrôlé par rien et ne servait à rien.
 */
export const RequireTier = (tier: TokenTier) => SetMetadata(REQUIRED_TIER_KEY, tier);

/** Monté en APP_GUARD après le JwtAuthGuard, qui a déjà posé request.user. */
@Injectable()
export class TierGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<TokenTier>(
      REQUIRED_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredTier) return true;

    const user = context.switchToHttp().getRequest<Request>().user;
    if (!user) throw new UnauthorizedException();

    if (user.tier !== requiredTier) {
      throw new ForbiddenException(`Tier ${requiredTier} required`);
    }

    return true;
  }
}
