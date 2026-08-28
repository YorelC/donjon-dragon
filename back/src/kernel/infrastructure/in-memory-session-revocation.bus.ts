import { Injectable } from '@nestjs/common';
import type { ActorId } from '@kernel/domain/actor-id';
import type {
  SessionRevocationListener,
  SessionRevocationPublisherPort,
  SessionRevocationSubscriberPort,
} from '@kernel/application/session-revocation.port';

@Injectable()
export class InMemorySessionRevocationBus
  implements SessionRevocationPublisherPort, SessionRevocationSubscriberPort
{
  private readonly listeners = new Set<SessionRevocationListener>();

  publish(userId: ActorId): void {
    this.listeners.forEach((listener) => listener(userId));
  }

  subscribe(listener: SessionRevocationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
