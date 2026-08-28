import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { FriendshipId } from './friendship-id';
import { FRIENDSHIP_STATUS, type FriendshipStatus } from './friendship-status';
import {
  CannotFriendSelfError,
  FriendRequestNotPendingError,
  NotFriendshipParticipantError,
  NotRequestRecipientError,
} from './friendship.errors';

const FIRST_REVISION = 0;

/**
 * État brut de la relation. Sert de frontière avec les deux mondes qui doivent
 * lire l'agrégat sans y toucher : la persistance et la réponse HTTP. Leurs
 * mappers respectifs partent de là — c'est le seul endroit où l'agrégat se
 * laisse aplatir.
 */
export interface FriendshipSnapshot {
  id: string;
  requesterId: string;
  recipientId: string;
  status: FriendshipStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Aggregate root de la relation d'amitié.
 *
 * Un seul document par paire d'utilisateurs. La direction
 * (requester → recipient) ne compte que tant que le statut est 'pending' :
 * une fois 'accepted', la relation est bidirectionnelle.
 *
 * Toutes les transitions passent par ses méthodes : aucun appelant ne peut
 * poser un statut directement.
 */
export class Friendship {
  private constructor(
    readonly id: FriendshipId,
    readonly requesterId: UserId,
    readonly recipientId: UserId,
    private currentStatus: FriendshipStatus,
    private currentRevision: number,
    readonly createdAt: string,
    private currentUpdatedAt: string,
  ) {}

  /** Nouvelle demande. On ne peut pas se demander soi-même en ami. */
  static request(requesterId: UserId, recipientId: UserId, now: Date): Friendship {
    if (requesterId.equals(recipientId)) throw new CannotFriendSelfError();

    const createdAt = now.toISOString();
    return new Friendship(
      FriendshipId.create(randomUUID()),
      requesterId,
      recipientId,
      FRIENDSHIP_STATUS.pending,
      FIRST_REVISION,
      createdAt,
      createdAt,
    );
  }

  /**
   * Réhydratation depuis la persistance : aucun invariant rejoué.
   *
   * La révision est tolérante à son absence : les documents écrits avant qu'elle
   * existe n'en portent pas, et repartent de la première.
   */
  static restore(snapshot: FriendshipSnapshot): Friendship {
    return new Friendship(
      FriendshipId.create(snapshot.id),
      UserId.create(snapshot.requesterId),
      UserId.create(snapshot.recipientId),
      snapshot.status,
      snapshot.revision ?? FIRST_REVISION,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  get status(): FriendshipStatus {
    return this.currentStatus;
  }

  get updatedAt(): string {
    return this.currentUpdatedAt;
  }

  get revision(): number {
    return this.currentRevision;
  }

  accept(by: UserId, now: Date): void {
    this.assertPendingRecipientAction(by);
    this.transitionTo(FRIENDSHIP_STATUS.accepted, now);
  }

  refuse(by: UserId, now: Date): void {
    this.assertPendingRecipientAction(by);
    this.transitionTo(FRIENDSHIP_STATUS.refused, now);
  }

  involves(userId: UserId): boolean {
    return this.requesterId.equals(userId) || this.recipientId.equals(userId);
  }

  /** L'autre participant. Lève si l'utilisateur n'est pas dans la relation. */
  friendIdFor(userId: UserId): UserId {
    if (!this.involves(userId)) throw new NotFriendshipParticipantError();

    return this.requesterId.equals(userId) ? this.recipientId : this.requesterId;
  }

  assertInvolves(userId: UserId): void {
    if (!this.involves(userId)) throw new NotFriendshipParticipantError();
  }

  snapshot(): FriendshipSnapshot {
    return {
      id: this.id.value,
      requesterId: this.requesterId.value,
      recipientId: this.recipientId.value,
      status: this.currentStatus,
      revision: this.currentRevision,
      createdAt: this.createdAt,
      updatedAt: this.currentUpdatedAt,
    };
  }

  /** Seul le destinataire d'une demande encore 'pending' peut y répondre. */
  private assertPendingRecipientAction(by: UserId): void {
    if (this.currentStatus !== FRIENDSHIP_STATUS.pending) {
      throw new FriendRequestNotPendingError();
    }
    if (!this.recipientId.equals(by)) throw new NotRequestRecipientError();
  }

  /** Seul point de mutation de l'état, donc seul point d'incrément de la révision. */
  private transitionTo(status: FriendshipStatus, now: Date): void {
    this.currentStatus = status;
    this.currentRevision += 1;
    this.currentUpdatedAt = now.toISOString();
  }
}
