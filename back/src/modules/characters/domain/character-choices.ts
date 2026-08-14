import { InvalidDomainError } from '@kernel/domain/domain.error';

import type { Ability } from './reference/abilities';
import type { EffectSourceType } from './reference/effect';
import type { ClassKey, OriginFeatKey, SpellKey } from './reference/keys';
import type { Language } from './reference/proficiencies';
import type { SkillName } from './reference/skills';

/**
 * D'où vient un choix. Sans cette trace, retirer une source laisserait ses choix
 * derrière elle : un personnage qui change d'historique garderait les compétences
 * de l'ancien.
 */
export interface ChoiceSource {
  type: EffectSourceType;
  key: string;
}

/**
 * Un choix fait à la création. Tous les champs sont optionnels parce qu'une même
 * source en remplit rarement plus d'un ou deux : la classe pose ses compétences,
 * le don Initié à la magie pose sa liste et ses sorts.
 */
export interface CharacterChoice {
  source: ChoiceSource;
  skills?: readonly SkillName[];
  expertise?: readonly SkillName[];
  tools?: readonly string[];
  languages?: readonly Language[];
  spells?: readonly SpellKey[];
  originFeat?: OriginFeatKey;
  spellcastingAbility?: Ability;
  spellList?: ClassKey;
  /** Le don de Style de combat du guerrier. */
  fightingStyle?: string;
  /** L'option d'Ordre divin (clerc) ou d'Ordre primitif (druide). */
  classOrder?: string;
  /** Une capacité nommée qui ne rentre dans aucun des champs ci-dessus. */
  feature?: string;
}

export interface CharacterChoicesSnapshot {
  choices: CharacterChoice[];
}

export class DuplicateSkillChoiceError extends InvalidDomainError {
  constructor() {
    super('The same skill proficiency was chosen twice');
  }
}

export class CharacterChoices {
  declare private readonly brand: 'CharacterChoices';

  private constructor(private readonly choices: readonly CharacterChoice[]) {}

  static create(choices: readonly CharacterChoice[]): CharacterChoices {
    const skills = choices.flatMap((choice) => choice.skills ?? []);
    if (new Set(skills).size !== skills.length) throw new DuplicateSkillChoiceError();

    return new CharacterChoices(choices.map(copyChoice));
  }

  static restore(snapshot: CharacterChoicesSnapshot): CharacterChoices {
    return new CharacterChoices(snapshot.choices.map(copyChoice));
  }

  get all(): readonly CharacterChoice[] {
    return this.choices;
  }

  /** Ce qu'une source précise a fait choisir — pour la lire, ou pour la retirer. */
  from(source: ChoiceSource): readonly CharacterChoice[] {
    return this.choices.filter(
      (choice) => choice.source.type === source.type && choice.source.key === source.key,
    );
  }

  snapshot(): CharacterChoicesSnapshot {
    return { choices: this.choices.map(copyChoice) };
  }
}

/** Les champs de type tableau sont recopiés ; les scalaires suivent par le spread. */
function copyChoice(choice: CharacterChoice): CharacterChoice {
  return {
    ...choice,
    source: { ...choice.source },
    skills: choice.skills ? [...choice.skills] : undefined,
    expertise: choice.expertise ? [...choice.expertise] : undefined,
    tools: choice.tools ? [...choice.tools] : undefined,
    languages: choice.languages ? [...choice.languages] : undefined,
    spells: choice.spells ? [...choice.spells] : undefined,
  };
}
