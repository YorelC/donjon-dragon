// Les 18 compétences de D&D 2024 et la caractéristique de leur test.
// Source : docs/characteres/competences.md

import type { Ability } from './abilities';

export const SKILLS = [
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
] as const;

export type SkillName = (typeof SKILLS)[number];

export const SKILL_ABILITY: Record<SkillName, Ability> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};

/** Libellés français, pour l'affichage de la fiche. */
export const SKILL_LABELS: Record<SkillName, string> = {
  acrobatics: 'Acrobaties',
  animalHandling: 'Dressage',
  arcana: 'Arcanes',
  athletics: 'Athlétisme',
  deception: 'Tromperie',
  history: 'Histoire',
  insight: 'Intuition',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Médecine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Représentation',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightOfHand: 'Escamotage',
  stealth: 'Discrétion',
  survival: 'Survie',
};

/** La Perception passive de la fiche : 10 plus le score de Perception. */
export const PASSIVE_SCORE_BASE = 10;
