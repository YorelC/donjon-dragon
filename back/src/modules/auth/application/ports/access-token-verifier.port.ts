export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');

export interface VerifiedAccessToken {
  userId: ActorId;
  expiresAtMs: number;
}

export interface AccessTokenVerifierPort {
  verify(token: string): Promise<VerifiedAccessToken | null>;
}
import type { ActorId } from '@kernel/domain/actor-id';
