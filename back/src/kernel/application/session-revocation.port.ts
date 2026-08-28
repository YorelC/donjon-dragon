import type { ActorId } from '@kernel/domain/actor-id';

export const SESSION_REVOCATION_PUBLISHER = Symbol(
  'SESSION_REVOCATION_PUBLISHER',
);
export const SESSION_REVOCATION_SUBSCRIBER = Symbol(
  'SESSION_REVOCATION_SUBSCRIBER',
);

export type SessionRevocationListener = (userId: ActorId) => void;

export interface SessionRevocationPublisherPort {
  publish(userId: ActorId): void;
}

export interface SessionRevocationSubscriberPort {
  subscribe(listener: SessionRevocationListener): () => void;
}
