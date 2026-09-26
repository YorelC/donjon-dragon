import type { CatalogSpell } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";
import { cantripQuotaOf, classOf, spellQuotaOf, type StepContext } from "./builder-lookups";
import { formatSigned } from "./character-recap";
import { cantripKeysOf, levelOneKeysOf } from "./chosen-spells";
import { spellIndexOf } from "./spell-index";
import {
  itemsBlock,
  proseBlock,
  selectionBlock,
  type DetailBadge,
  type DetailItem,
  type DetailSource,
  type StepDetail,
} from "./step-detail-parts";

const READING_HINT =
  "Survolez un sort : sa fiche complète s'affiche ici. Concentration signifie qu'un seul de ces sorts peut être actif à la fois ; Rituel permet de le lancer sans emplacement, en y consacrant dix minutes de plus.";

interface SpellKind {
  title: string;
  lede: string;
  retained: (composition: CharacterComposition) => string[];
  quota: (context: StepContext) => number;
}

/** Le sort survolé en fiche complète ; sans survol, la sélection et le DD de la classe. */
function spellStepDetail(kind: SpellKind) {
  return (source: DetailSource): StepDetail => {
    const spell = source.focusKey ? spellIndexOf(source.spells).get(source.focusKey) : undefined;
    if (spell) return spellSheetOf(source, spell);

    return spellOverview(source, kind);
  };
}

export const cantripsDetail = spellStepDetail({
  title: "Sorts mineurs",
  lede: "Un sort mineur ne consomme pas d'emplacement et se lance à volonté.",
  retained: cantripKeysOf,
  quota: cantripQuotaOf,
});

export const spellsDetail = spellStepDetail({
  title: "Sorts de niveau 1",
  lede: "Vos sorts de niveau 1 consomment un emplacement, récupéré au Repos long.",
  retained: levelOneKeysOf,
  quota: spellQuotaOf,
});

/** La fiche d'un sort, partagée par les sorts de classe, de don et de grimoire. */
export function spellSheetOf(source: DetailSource, spell: CatalogSpell): StepDetail {
  return {
    kicker: `${spell.level === 0 ? "Sort mineur" : "Sort de niveau 1"} · ${spell.school}`,
    title: spell.name,
    lede: spell.description,
    badges: spellBadges(spell),
    blocks: [itemsBlock("État", [spellState(source, spell.key)])],
  };
}

function spellBadges(spell: CatalogSpell): DetailBadge[] {
  const badges = [
    { label: "École", value: spell.school },
    { label: "Incantation", value: spell.castingTime },
    { label: "Portée", value: spell.range },
    { label: "Durée", value: spell.concentration ? `Concentration, ${spell.duration}` : spell.duration },
  ];

  return spell.ritual ? [...badges, { label: "Rituel", value: "Oui" }] : badges;
}

function spellState({ context, spells }: DetailSource, key: string): DetailItem {
  const retained = [...cantripKeysOf(context.composition), ...levelOneKeysOf(context.composition)];
  if (spells.grantedSpells.includes(key)) {
    return { name: "Toujours préparé", text: "Accordé sans choix : il ne compte pas dans vos choix." };
  }
  if (retained.includes(key)) return { name: "Retenu", text: "Cliquez à nouveau pour le relâcher." };

  return { name: "Disponible", text: "Cliquez pour le retenir." };
}

function spellOverview(source: DetailSource, kind: SpellKind): StepDetail {
  const { context } = source;
  const retained = kind.retained(context.composition);
  const index = spellIndexOf(source.spells);

  return {
    kicker: classOf(context)?.name ?? "Magie",
    title: kind.title,
    lede: kind.lede,
    badges: [{ label: "À choisir", value: `${retained.length} / ${kind.quota(context)}` }, ...castingBadges(source)],
    blocks: [
      selectionBlock(retained.map((key) => index.get(key)?.name ?? key), kind.quota(context)),
      proseBlock("Lire une fiche", READING_HINT),
    ],
  };
}

function castingBadges({ preview }: DetailSource): DetailBadge[] {
  const casting = preview?.spellcasting[0];
  if (!casting) return [];

  return [
    { label: "DD des sauvegardes", value: String(casting.saveDc) },
    { label: "Attaque de sort", value: formatSigned(casting.attackBonus) },
  ];
}
