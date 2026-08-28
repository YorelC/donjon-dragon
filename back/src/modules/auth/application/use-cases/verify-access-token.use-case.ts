import { Inject, Injectable } from '@nestjs/common';
import type { ActorId } from '@kernel/domain/actor-id';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifierPort,
} from '../ports/access-token-verifier.port';

export interface VerifiedRealtimeSession {
  userId: ActorId;
  expiresAtMs: number;
}

@Injectable()
export class VerifyAccessTokenUseCase {
  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly verifier: AccessTokenVerifierPort,
  ) {}

  async execute(token: string): Promise<VerifiedRealtimeSession | null> {
    const verified = await this.verifier.verify(token);
    if (!verified) return null;
    return {
      userId: verified.userId,
      expiresAtMs: verified.expiresAtMs,
    };
  }
}
