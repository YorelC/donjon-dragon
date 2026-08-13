// Les états de D&D 2024. Au niveau 1 ils ne sont jamais appliqués par le moteur :
// ils servent à dire contre quoi un trait donne un avantage ou une immunité
// (« Avantage aux jets de sauvegarde contre l'état Charmé »).

export const CONDITION_STATES = [
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
] as const;

export type ConditionState = (typeof CONDITION_STATES)[number];

export const CONDITION_LABELS: Record<ConditionState, string> = {
  blinded: 'Aveuglé',
  charmed: 'Charmé',
  deafened: 'Assourdi',
  exhaustion: 'Épuisement',
  frightened: 'Effrayé',
  grappled: 'Agrippé',
  incapacitated: "Incapable d'agir",
  invisible: 'Invisible',
  paralyzed: 'Paralysé',
  petrified: 'Pétrifié',
  poisoned: 'Empoisonné',
  prone: 'À terre',
  restrained: 'Entravé',
  stunned: 'Étourdi',
  unconscious: 'Inconscient',
};
