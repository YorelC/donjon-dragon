import type { SrdRef } from './srd-equipment.ts';
import { readSrdFile } from './srd-equipment.ts';

/**
 * Les espèces et les classes du SRD 5.2, dans leur forme d'origine.
 *
 * Même frontière que pour l'équipement : au-delà de ce fichier, plus personne ne
 * lit un `{index, name, url}`.
 */

export type SrdSpecies = {
  index: string;
  name: string;
  size: string;
  speed: number;
  traits?: SrdRef[];
  subspecies?: SrdRef[];
};

export type SrdOption = { option_type: string; item?: SrdRef };

export type SrdChoice = {
  desc?: string;
  choose: number;
  type: string;
  from: { option_set_type: string; options?: SrdOption[] };
};

/** Une classe dont la caractéristique principale est un choix porte `ability_score_options`. */
export type SrdPrimaryAbility = {
  desc: string;
  ability_scores?: SrdRef[];
  ability_score_options?: SrdChoice;
};

export type SrdClass = {
  index: string;
  name: string;
  hit_die: number;
  primary_ability?: SrdPrimaryAbility;
  saving_throws: SrdRef[];
  proficiencies: SrdRef[];
  proficiency_choices?: SrdChoice[];
};

export function readSrdSpecies(): SrdSpecies[] {
  return readSrdFile<SrdSpecies>('5e-SRD-Species.json');
}

export function readSrdClasses(): SrdClass[] {
  return readSrdFile<SrdClass>('5e-SRD-Classes.json');
}
