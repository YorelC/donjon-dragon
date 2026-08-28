import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayloadSchema } from '@donjon-dragon/shared/auth-schema';
import { z } from 'zod';
import { actorFromVerifiedToken } from '@kernel/domain/actor-id';
import type {
  AccessTokenVerifierPort,
  VerifiedAccessToken,
} from '../../application/ports/access-token-verifier.port';

const SignedAccessTokenSchema = TokenPayloadSchema.extend({
  exp: z.number().int().positive(),
});
const MILLISECONDS_PER_SECOND = 1_000;

@Injectable()
export class JwtAccessTokenVerifier implements AccessTokenVerifierPort {
  constructor(private readonly jwt: JwtService) {}

  async verify(token: string): Promise<VerifiedAccessToken | null> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
        algorithms: ['HS256'],
      });
      const parsed = SignedAccessTokenSchema.safeParse(payload);
      if (!parsed.success) return null;
      return {
        userId: actorFromVerifiedToken(parsed.data.userId),
        expiresAtMs: parsed.data.exp * MILLISECONDS_PER_SECOND,
      };
    } catch {
      return null;
    }
  }
}
