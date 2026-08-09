import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { TokenPayloadSchema, type TokenPayload } from '@donjon-dragon/shared/auth-schema';

import { ACCESS_COOKIE } from '../session-cookies';

const fromSessionCookie = (request: Request): string | null =>
  request.cookies?.[ACCESS_COOKIE] ?? null;

/**
 * Verification de l'access token. Ce que `validate` retourne devient
 * `request.user` : on le fait passer par le schema Zod plutot que de caster,
 * pour qu'un token signe mais malforme soit refuse et non propage.
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

  validate(payload: unknown): TokenPayload {
    const result = TokenPayloadSchema.safeParse(payload);
    if (!result.success) throw new UnauthorizedException('Malformed token payload');
    return result.data;
  }
}
