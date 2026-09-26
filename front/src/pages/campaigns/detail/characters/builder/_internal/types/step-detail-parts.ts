import type { ComputedCharacter, Item } from "@donjon-dragon/shared";
import type { SpellsStep } from "../views/spells-step.view";
import type { StepContext } from "./builder-lookups";

/** Ce que la fiche détaillée lit : la composition, l'option survolée, et le calcul serveur. */
export interface DetailSource {
  context: StepContext;
  focusKey: string | null;
  spells: SpellsStep;
  preview: ComputedCharacter | null;
  items: Item[];
}

export interface DetailBadge {
  label: string;
  value: string;
}

export interface DetailItem {
  name: string;
  text: string;
}

export interface DetailBlock {
  heading: string;
  body: string | null;
  items: DetailItem[];
}

/** La fiche de la maquette : surtitre, titre, chapeau, pastilles, puis des blocs. */
export interface StepDetail {
  kicker: string;
  title: string;
  lede: string | null;
  badges: DetailBadge[];
  blocks: DetailBlock[];
}

const NOTHING_RETAINED = "Rien de retenu";
const NOTHING_RETAINED_HINT = "Cliquez une option pour la garder, cliquez à nouveau pour la relâcher.";

/** L'option survolée l'emporte ; sans survol, la fiche montre ce qui est retenu. */
export function shownKey(source: DetailSource, selected: string | null): string | null {
  return source.focusKey ?? selected;
}

export function proseBlock(heading: string, body: string): DetailBlock {
  return { heading, body, items: [] };
}

export function itemsBlock(heading: string, items: DetailItem[]): DetailBlock {
  return { heading, body: null, items };
}

/** Traits, aptitudes, options décrites : un bloc, ou rien s'il n'y a rien à lister. */
export function describedBlock(
  heading: string,
  entries: readonly { name: string; description: string }[],
): DetailBlock | null {
  if (entries.length === 0) return null;

  return itemsBlock(heading, entries.map((entry) => ({ name: entry.name, text: entry.description })));
}

/** « Votre sélection (1 / 2) », puis les noms retenus — ou l'invitation à choisir. */
export function selectionBlock(names: readonly string[], count: number): DetailBlock {
  const items = names.length > 0
    ? names.map((name) => ({ name, text: "" }))
    : [{ name: NOTHING_RETAINED, text: NOTHING_RETAINED_HINT }];

  return itemsBlock(`Votre sélection (${names.length} / ${count})`, items);
}

export function presentBlocks(blocks: readonly (DetailBlock | null)[]): DetailBlock[] {
  return blocks.filter((block): block is DetailBlock => block !== null);
}

/** Une fiche sans pastille ni bloc : l'étape n'a encore rien à montrer. */
export function plainDetail(kicker: string, title: string, lede: string | null = null): StepDetail {
  return { kicker, title, lede, badges: [], blocks: [] };
}

export function metersOf(value: number): string {
  return `${value} m`;
}

export function labelsOf(keys: readonly string[], labels: Partial<Record<string, string>>): string {
  return keys.map((key) => labels[key] ?? key).join(", ");
}
