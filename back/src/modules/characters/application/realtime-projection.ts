import {
  REALTIME_RESOURCE,
  type RealtimeResource,
} from '@donjon-dragon/shared/realtime-schema';

export const CHARACTERS_OWNER_MODULE = 'characters';

/** Les faits que ce module écrit dans l'outbox. Vocabulaire fermé, et à lui. */
export const CHARACTER_FACT = {
  assigned: 'character.assigned',
  unassigned: 'character.unassigned',
} as const;

export type CharacterFact = (typeof CHARACTER_FACT)[keyof typeof CHARACTER_FACT];

/**
 * Ce que le client doit réinvalider pour chacun de ces faits.
 *
 * `campaigns` et non une ressource dédiée : le client invalide tout le préfixe
 * `["campaigns"]`, dont la liste des personnages d'une table. Une ressource
 * propre affinerait l'invalidation, elle n'est pas nécessaire pour livrer.
 */
export const CHARACTER_REALTIME_PROJECTION: Record<
  CharacterFact,
  RealtimeResource | null
> = {
  [CHARACTER_FACT.assigned]: REALTIME_RESOURCE.campaigns,
  [CHARACTER_FACT.unassigned]: REALTIME_RESOURCE.campaigns,
};
