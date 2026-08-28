import type { RealtimeResourceChanged } from '@donjon-dragon/shared/realtime-schema';

export const REALTIME_NOTIFIER = Symbol('REALTIME_NOTIFIER');

/**
 * Sortie du relais vers les clients connectés.
 *
 * Le relais publie un fait après commit ; il n'a pas à savoir qu'un serveur
 * Socket.IO existe, ni que la gateway qui l'implémente vit dans la présentation.
 * C'est aussi ce qui rend le relais testable sans transport.
 */
export interface RealtimeNotifierPort {
  notifyUsers(
    userIds: readonly string[],
    payload: RealtimeResourceChanged,
  ): void;
}
