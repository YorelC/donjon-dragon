import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { TokenPayloadSchema } from '@donjon-dragon/shared/auth-schema';

import {
  actorFromVerifiedToken,
  type AuthenticatedActor,
} from '@kernel/domain/actor-id';
import { ACCESS_COOKIE } from '@common/security/session-cookie.constants';

const fromSessionCookie = (request: Request): string | null =>
  request.cookies?.[ACCESS_COOKIE] ?? null;

/**
 * Verification de l'access token. Ce que `validate` retourne devient
 * `request.user` : on le fait passer par le schema Zod plutot que de caster,
 * pour qu'un token signe mais malforme soit refuse et non propage.
 *
 * L'identite vient d'une signature verifiee et non du client. Le transport
 * temps réel applique la même frontière via VerifyAccessTokenUseCase.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // Le token vit dans un cookie httpOnly, pas dans un en-tête : aucun script
      // de la page ne peut le lire, donc une faille XSS ne l'exfiltre pas.
      jwtFromRequest: ExtractJwt.fromExtractors([fromSessionCookie]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: unknown): AuthenticatedActor {
    const result = TokenPayloadSchema.safeParse(payload);
    if (!result.success) throw new UnauthorizedException('Malformed token payload');
    return { userId: actorFromVerifiedToken(result.data.userId) };
  }
}
