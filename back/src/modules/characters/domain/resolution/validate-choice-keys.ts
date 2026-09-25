import type { CharacterChoice } from '../character-choices';
import { CLASS_ORDERS } from '../reference/class-orders';
import {
  ALL_CONCRETE_TOOLS,
  LEVEL_ONE_FAMILIAR_FORMS,
  LEVEL_ONE_INVOCATIONS,
} from '../reference/creation-options';
import { FIGHTING_STYLE_KEYS } from '../reference/fighting-styles';
import { SPECIES } from '../reference/species';
import { SPELLS } from '../reference/spells';
import { WEAPONS } from '../reference/weapons';
import { UnknownLineageError, fail, type ChoicesToValidate } from './choice-validation';
import { assertChoiceSources } from './validate-choices';

/**
 * Le contrôle de l'aperçu (spec 009, « Deux frontières ») : le wizard le demande
 * à mi-parcours, quand les quotas ne sont pas encore remplis. On n'y refuse donc
 * que ce qui ne deviendra jamais valide — une source, un champ ou une clé
 * inconnus — pour que le moteur ne calcule jamais sur une clé inventée. Les
 * quotas restent l'affaire de `validateChoices`, à la création et à l'édition.
 */
export function validateChoiceKeys(input: ChoicesToValidate): void {
  assertChoiceSources(input);
  assertKnownLineage(input);
  input.choices.all.forEach(assertKnownValues);
}

function assertKnownLineage(input: ChoicesToValidate): void {
  if (input.lineageKey === null) return;
  const options = SPECIES[input.speciesKey].lineage?.options ?? [];
  if (!options.some((option) => option.key === input.lineageKey)) throw new UnknownLineageError();
}

type KeyedField =
  | 'tools' | 'spells' | 'invocationSpells' | 'spellbook' | 'weaponMasteries'
  | 'pactWeaponKey' | 'fightingStyle' | 'classOrder' | 'invocation' | 'familiarForm';

const SPELL_KEYS: ReadonlySet<string> = new Set(Object.keys(SPELLS));
const WEAPON_KEYS: ReadonlySet<string> = new Set(Object.keys(WEAPONS));
const CLASS_ORDER_KEYS: ReadonlySet<string> = new Set(
  Object.values(CLASS_ORDERS).flatMap((order) => order?.options.map((option) => option.key) ?? []),
);

const KNOWN_KEYS: Readonly<Record<KeyedField, ReadonlySet<string>>> = {
  tools: new Set(ALL_CONCRETE_TOOLS),
  spells: SPELL_KEYS,
  invocationSpells: SPELL_KEYS,
  spellbook: SPELL_KEYS,
  weaponMasteries: WEAPON_KEYS,
  pactWeaponKey: WEAPON_KEYS,
  fightingStyle: new Set(FIGHTING_STYLE_KEYS),
  classOrder: CLASS_ORDER_KEYS,
  invocation: new Set(LEVEL_ONE_INVOCATIONS),
  familiarForm: new Set(LEVEL_ONE_FAMILIAR_FORMS),
};

const KEYED_FIELDS = Object.keys(KNOWN_KEYS) as readonly KeyedField[];

function assertKnownValues(choice: CharacterChoice): void {
  const unknown = KEYED_FIELDS.find((field) =>
    !valuesOf(choice, field).every((value) => KNOWN_KEYS[field].has(value)),
  );
  if (unknown) fail(unknown);
}

function valuesOf(choice: CharacterChoice, field: KeyedField): readonly string[] {
  const value = choice[field];
  if (value === undefined) return [];
  return typeof value === 'string' ? [value] : value;
}
