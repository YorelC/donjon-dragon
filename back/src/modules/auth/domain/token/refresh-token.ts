import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { TokenSecret } from '../token-secret';
import { TokenFamilyId } from './token-family-id';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fenêtre pendant laquelle un token déjà consommé est traité comme une COURSE et
 * non comme une fuite.
 *
 * Deux onglets partagent la même session : le premier fait tourner le token, le
 * second présente encore l'ancien. Sans cette fenêtre, la détection de
 * réutilisation fait tomber la lignée entière et déconnecte les deux — un
 * comportement sûr, mais qui passe pour un bug.
 *
 * Volontairement courte : au-delà, un rejeu n'est plus une concurrence
 * plausible, c'est un secret qui a fuité.
 */
export const REFRESH_GRACE_MS = 10_000;

/**
 * Pourquoi un token a été révoqué. Ce n'est pas de la décoration : seule une
 * révocation par ROTATION peut être une course entre onglets. Une lignée révoquée
 * pour compromission doit refuser immédiatement, sans fenêtre de tolérance —
 * sinon la victime d'une fuite reçoit des « réessaie » pendant dix secondes.
 */
const REVOCATION_REASONS = ['rotated', 'compromised'] as const;

export type RevocationReason = (typeof REVOCATION_REASONS)[number];

export const REVOKED_BY = Object.fromEntries(
  REVOCATION_REASONS.map((reason) => [reason, reason]),
) as { readonly [R in RevocationReason]: R };

/** Tuple pour l'enum de persistance. */
export const REVOCATION_REASON_VALUES: readonly RevocationReason[] =
  REVOCATION_REASONS;

export interface RefreshTokenSnapshot {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: string;
  revokedAt?: string;
  revokedReason?: RevocationReason;
  createdAt: string;
}

/**
 * Aggregate root du refresh token : un secret opaque, à usage unique, rattaché
 * à une lignée.
 *
 * Ce n'est pas un JWT — rien n'est signé. Sa validité vient de sa présence en
 * base et de son état, ce qui est précisément ce qui permet de le révoquer.
 */
export class RefreshToken {
  private constructor(
    readonly id: string,
    readonly userId: UserId,
    readonly secret: TokenSecret,
    readonly familyId: TokenFamilyId,
    readonly expiresAt: string,
    private revokedAtIso: string | undefined,
    private revokedReason: RevocationReason | undefined,
    readonly createdAt: string,
  ) {}

  /**
   * Émet un token. `familyId` absent ouvre une nouvelle lignée (connexion) ;
   * fourni, il poursuit la lignée existante (rotation).
   */
  static issue(
    userId: UserId,
    now: Date,
    familyId?: TokenFamilyId,
  ): { token: RefreshToken; plainToken: string } {
    const { secret, plainToken } = TokenSecret.issue();

    const token = new RefreshToken(
      randomUUID(),
      userId,
      secret,
      familyId ?? TokenFamilyId.fresh(),
      new Date(now.getTime() + REFRESH_TTL_MS).toISOString(),
      undefined,
      undefined,
      now.toISOString(),
    );

    return { token, plainToken };
  }

  static restore(snapshot: RefreshTokenSnapshot): RefreshToken {
    return new RefreshToken(
      snapshot.id,
      UserId.create(snapshot.userId),
      TokenSecret.fromHash(snapshot.tokenHash),
      TokenFamilyId.create(snapshot.familyId),
      snapshot.expiresAt,
      snapshot.revokedAt,
      snapshot.revokedReason,
      snapshot.createdAt,
    );
  }

  get isRevoked(): boolean {
    return this.revokedAtIso !== undefined;
  }

  isExpired(now: Date): boolean {
    return new Date(this.expiresAt).getTime() < now.getTime();
  }

  /**
   * Ce token vient-il d'être remplacé par une rotation ? C'est la seule situation
   * où un rejeu peut être une course entre onglets plutôt qu'une fuite.
   */
  isRecentRotation(withinMs: number, now: Date): boolean {
    if (!this.revokedAtIso) return false;
    if (this.revokedReason !== REVOKED_BY.rotated) return false;

    return now.getTime() - new Date(this.revokedAtIso).getTime() <= withinMs;
  }

  belongsTo(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  /**
   * Usage unique : consommer un token le révoque. Idempotent, mais une
   * compromission écrase une simple rotation — on ne redescend jamais d'une
   * révocation de sécurité vers une révocation de routine.
   */
  revoke(now: Date, reason: RevocationReason = REVOKED_BY.rotated): void {
    if (this.revokedAtIso && this.revokedReason === REVOKED_BY.compromised) return;

    // `now` explicite, et pas seulement par principe : c'est cette date que
    // `isRecentRotation` compare à la fenêtre de grâce. Les deux doivent venir de la
    // même horloge, sinon la fenêtre se mesure entre deux référentiels différents.
    this.revokedAtIso ??= now.toISOString();
    this.revokedReason = reason;
  }

  snapshot(): RefreshTokenSnapshot {
    return {
      id: this.id,
      userId: this.userId.value,
      tokenHash: this.secret.hash,
      familyId: this.familyId.value,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAtIso,
      revokedReason: this.revokedReason,
      createdAt: this.createdAt,
    };
  }
}
