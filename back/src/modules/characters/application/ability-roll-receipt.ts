/**
 * Le vocabulaire du reçu d'un tirage, partagé par les deux adapters qui y
 * touchent : celui qui l'émet, et celui qui le consomme en créant le
 * personnage. Un tirage émis est libre ; consommé, il ne resert jamais.
 */
export const ABILITY_ROLL_INTENTION = 'character.abilityRoll.issued';

export const ABILITY_ROLL_STATUS = {
  issued: 'accepted',
  consumed: 'consumed',
} as const;
