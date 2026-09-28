import type { CharacterComposition, MagicInitiateSelection } from "./character-composition";
import type { SpellGrant, SpellSource } from "./chosen-spells";

/** Un groupe de sorts et ce qu'il a coché : c'est ce qu'il ne se prend pas à lui-même. */
export interface OwnSpells {
  group: string;
  keys: readonly string[];
}

/** Pourquoi un sort est indisponible : ce qui l'accorde, ou le groupe qui l'a déjà pris. */
export interface SpellOrigin {
  kind: "granted" | "chosen";
  label: string;
}

export type SpellOrigins = Readonly<Record<string, SpellOrigin>>;

/** La source des sorts, avec le nom de ce qui accorde chaque octroi. */
export interface NamedSpellSource extends SpellSource {
  grantedBy: readonly SpellGrant[];
}

export type MagicInitiateKind = "cantrips" | "spells";

const MAGIC_INITIATE_TITLES: Record<MagicInitiateKind, string> = {
  cantrips: "Sorts mineurs",
  spells: "Sort de niveau 1",
};

const GRANTER_LABELS: Record<MagicInitiateSelection["grantedBy"]["type"], string> = {
  background: "Historique",
  species: "Espèce",
};

export const SPELL_GROUPS = {
  classCantrips: "Sorts mineurs de classe",
  classSpells: "Sorts préparés",
  spellbook: "Grimoire",
  featCantrips: "Initié à la magie",
  featSpells: "Initié à la magie",
  invocationSpells: "Pacte du Grimoire",
} as const;

type FixedSpellGroup = keyof typeof SPELL_GROUPS;

interface SpellHolder {
  group: string;
  label: string;
  keys: readonly string[];
}

/** « Sorts mineurs — Historique » : le titre d'un groupe d'Initié à la magie. */
export function magicInitiateTitleOf(choice: MagicInitiateSelection, kind: MagicInitiateKind): string {
  return `${MAGIC_INITIATE_TITLES[kind]} — ${GRANTER_LABELS[choice.grantedBy.type]}`;
}

/** L'Humain Initié en porte deux : l'identifiant du groupe dit lequel. */
export function magicInitiateGroupOf(choice: MagicInitiateSelection, kind: MagicInitiateKind): string {
  return `magic:${choice.grantedBy.type}:${choice.grantedBy.key}:${kind}`;
}

/**
 * La source de chaque sort qu'un groupe ne peut plus prendre. Un octroi l'emporte
 * sur un choix, et le premier groupe qui l'a pris sur les suivants.
 */
export function spellOriginsOf(source: NamedSpellSource, own: OwnSpells): SpellOrigins {
  const granted = source.grantedBy.flatMap((grant) =>
    grant.keys.map((key) => [key, { kind: "granted", label: grant.label }] as const));
  const chosen = holdersOf(source.composition)
    .filter((holder) => holder.group !== own.group)
    .flatMap((holder) => holder.keys.map((key) => [key, { kind: "chosen", label: holder.label }] as const));

  return firstWins([...granted, ...chosen]);
}

function holdersOf(composition: CharacterComposition): SpellHolder[] {
  const fixed = (Object.keys(SPELL_GROUPS) as FixedSpellGroup[]).map((group) => ({
    group,
    label: SPELL_GROUPS[group],
    keys: composition[group],
  }));

  return [...fixed, ...composition.magicInitiateChoices.flatMap(magicInitiateHoldersOf)];
}

function magicInitiateHoldersOf(choice: MagicInitiateSelection): SpellHolder[] {
  return (["cantrips", "spells"] as const).map((kind) => ({
    group: magicInitiateGroupOf(choice, kind),
    label: magicInitiateTitleOf(choice, kind),
    keys: choice[kind],
  }));
}

/** `Object.fromEntries` garde la dernière valeur d'une clé : on renverse pour garder la première. */
function firstWins(entries: readonly (readonly [string, SpellOrigin])[]): SpellOrigins {
  return Object.fromEntries([...entries].reverse());
}
