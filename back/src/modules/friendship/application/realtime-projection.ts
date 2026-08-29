import {
  REALTIME_RESOURCE,
  type RealtimeResource,
} from '@donjon-dragon/shared/realtime-schema';

export const FRIENDSHIP_OWNER_MODULE = 'friendship';

/** Les faits que ce module écrit dans l'outbox. Vocabulaire fermé, et à lui. */
export const FRIENDSHIP_FACT = {
  requested: 'friendship.requested',
  accepted: 'friendship.accepted',
  refused: 'friendship.refused',
  removed: 'friendship.removed',
} as const;

export type FriendshipFact = (typeof FRIENDSHIP_FACT)[keyof typeof FRIENDSHIP_FACT];

/**
 * Ce que le client doit réinvalider pour chacun de ces faits.
 *
 * La projection appartient au module qui produit le fait, pas au diffuseur :
 * c'est ici qu'on sait ce qu'une amitié change à l'écran. Le `Record` est total
 * sur le vocabulaire ci-dessus — ajouter un fait sans dire ce qu'il invalide ne
 * compile pas, et un fait connu ne peut donc pas partir en quarantaine par oubli.
 */
export const FRIENDSHIP_REALTIME_PROJECTION: Record<
  FriendshipFact,
  RealtimeResource | null
> = {
  [FRIENDSHIP_FACT.requested]: REALTIME_RESOURCE.friendships,
  [FRIENDSHIP_FACT.accepted]: REALTIME_RESOURCE.friendships,
  [FRIENDSHIP_FACT.refused]: REALTIME_RESOURCE.friendships,
  [FRIENDSHIP_FACT.removed]: REALTIME_RESOURCE.friendships,
};
