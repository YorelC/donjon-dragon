import {
  InvalidArmorClassError,
  InvalidHitPointsError,
  InvalidMonsterNameError,
  InvalidMonsterScopeError,
} from './monster.errors';
import { MonsterKey } from './monster-key';

/** Même vocabulaire que le catalogue d'objets : le manuel, ou la table d'un MJ. */
export const MONSTER_ORIGINS = ['srd', 'campaign'] as const;

export type MonsterOrigin = (typeof MONSTER_ORIGINS)[number];

export interface MonsterAbilitiesSnapshot {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  strMod: string;
  dexMod: string;
  conMod: string;
  intMod: string;
  wisMod: string;
  chaMod: string;
  strSave: string;
  dexSave: string;
  conSave: string;
  intSave: string;
  wisSave: string;
  chaSave: string;
}

/** Trait, action, action bonus, réaction, action légendaire : même forme. */
export interface MonsterEntrySnapshot {
  name: string;
  description: string;
}

export interface MonsterSnapshot {
  key: string;
  name: string;
  type: string;
  size: string;
  alignment: string | null;

  armorClass: number;
  hitPoints: number | null;
  hitDice: string | null;
  initiativeBonus: number | null;
  speed: string;

  skills: string | null;
  damageImmunities: string | null;
  damageResistances: string | null;
  damageVulnerabilities: string | null;
  conditionImmunities: string | null;
  senses: string;
  languages: string;

  /** `null` pour les profils d'invocation, dont la puissance suit l'incantateur. */
  challengeRating: string | null;
  xp: string | null;
  proficiencyBonus: string | null;

  abilities: MonsterAbilitiesSnapshot;
  traits: MonsterEntrySnapshot[];
  actions: MonsterEntrySnapshot[];
  bonusActions: MonsterEntrySnapshot[];
  reactions: MonsterEntrySnapshot[];
  legendaryActions: MonsterEntrySnapshot[];
  mythicActions: MonsterEntrySnapshot[];

  source: string | null;
  nameEN: string | null;
  nameES: string | null;

  origin: MonsterOrigin;
  /** Renseigné si et seulement si `origin` vaut `campaign`. */
  campaignId: string | null;
}

/**
 * Un profil de créature : ce que le MJ jette sur la table.
 *
 * Contrairement au personnage, rien n'est recalculé — le manuel imprime la
 * classe d'armure et les points de vie, et c'est ce qu'on garde. Les invariants
 * se limitent donc à ce qui rendrait un combat absurde : un profil sans nom, une
 * classe d'armure négative, ou une portée qui se contredit.
 */
export class Monster {
  declare private readonly brand: 'Monster';

  private constructor(private readonly state: MonsterSnapshot) {}

  static create(snapshot: MonsterSnapshot): Monster {
    const key = MonsterKey.create(snapshot.key);
    const name = snapshot.name.trim();
    if (name === '') throw new InvalidMonsterNameError();
    assertArmorClass(snapshot.armorClass);
    assertHitPoints(snapshot.hitPoints);
    assertScope(snapshot.origin, snapshot.campaignId);

    return new Monster({ ...snapshot, key: key.value, name });
  }

  static restore(snapshot: MonsterSnapshot): Monster {
    return new Monster({ ...snapshot });
  }

  get key(): string {
    return this.state.key;
  }

  get name(): string {
    return this.state.name;
  }

  get challengeRating(): string | null {
    return this.state.challengeRating;
  }

  /** Inventé par un MJ, par opposition à repris du manuel. */
  get isHomebrew(): boolean {
    return this.state.origin === 'campaign';
  }

  /** Un profil du manuel se voit partout, celui d'un MJ dans sa campagne seule. */
  isVisibleIn(campaignId: string): boolean {
    return !this.isHomebrew || this.state.campaignId === campaignId;
  }

  snapshot(): MonsterSnapshot {
    return {
      ...this.state,
      abilities: { ...this.state.abilities },
      traits: copyEntries(this.state.traits),
      actions: copyEntries(this.state.actions),
      bonusActions: copyEntries(this.state.bonusActions),
      reactions: copyEntries(this.state.reactions),
      legendaryActions: copyEntries(this.state.legendaryActions),
      mythicActions: copyEntries(this.state.mythicActions),
    };
  }
}

function copyEntries(entries: MonsterEntrySnapshot[]): MonsterEntrySnapshot[] {
  return entries.map((entry) => ({ ...entry }));
}

function assertArmorClass(armorClass: number): void {
  if (!Number.isInteger(armorClass) || armorClass < 0) throw new InvalidArmorClassError();
}

/**
 * `null` reste permis : quelques profils d'invocation tirent leurs points de vie
 * de l'incantateur. Zéro, en revanche, décrit une créature déjà morte.
 */
function assertHitPoints(hitPoints: number | null): void {
  if (hitPoints === null) return;
  if (!Number.isInteger(hitPoints) || hitPoints <= 0) throw new InvalidHitPointsError();
}

function assertScope(origin: MonsterOrigin, campaignId: string | null): void {
  const belongsToCampaign = origin === 'campaign';
  if (belongsToCampaign !== (campaignId !== null)) throw new InvalidMonsterScopeError();
}
