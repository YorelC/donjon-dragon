import type { CatalogSpell, ComputedCharacter } from "@donjon-dragon/shared";
import type { StatTokenData } from "@/shared/components/molecules/stat-token";
import type { SpellsStep } from "../views/spells-step.view";
import { classOf, speciesOf, type StepContext } from "./builder-lookups";
import { spellIndexOf } from "./spell-index";

export interface RecapTokenGroup {
  heading: string;
  tokens: StatTokenData[];
}

interface TokenSource {
  context: StepContext;
  preview: ComputedCharacter | null;
  spells: SpellsStep;
}

type CastableList = "cantripsKnown" | "spellsPrepared";

/**
 * Les jetons du récapitulatif : une liste longue condensée en initiales, le nom
 * complet et l'effet passant par l'infobulle. Un groupe vide ne s'affiche pas.
 */
export function recapTokenGroupsOf(source: TokenSource): RecapTokenGroup[] {
  const spells = spellIndexOf(source.spells);
  const groups = [
    { heading: "Sorts mineurs", tokens: castableTokens(source.preview, "cantripsKnown", spells) },
    { heading: "Sorts", tokens: castableTokens(source.preview, "spellsPrepared", spells) },
    { heading: "Actions et aptitudes", tokens: featureTokens(source) },
  ];

  return groups.filter((group) => group.tokens.length > 0);
}

/** Un sort sans fiche chargée garde au moins son origine : lignée, classe, don. */
function castableTokens(
  preview: ComputedCharacter | null,
  list: CastableList,
  spells: Map<string, CatalogSpell>,
): StatTokenData[] {
  const tokens = (preview?.spellcasting ?? []).flatMap((casting) =>
    casting[list].map((spell) => ({
      name: spell.name,
      effect: spells.get(spell.spellKey)?.description ?? casting.origin,
    })),
  );

  return uniqueByName(tokens);
}

/** Avant l'aperçu serveur, les traits d'espèce et les aptitudes de classe du catalogue. */
function featureTokens({ context, preview }: TokenSource): StatTokenData[] {
  if (preview) {
    return uniqueByName(preview.features.map((feature) => ({
      name: feature.name,
      effect: feature.notes.join(" ") || feature.source,
    })));
  }
  const features = [...(speciesOf(context)?.traits ?? []), ...(classOf(context)?.level1Features ?? [])];

  return uniqueByName(features.map((feature) => ({ name: feature.name, effect: feature.description })));
}

function uniqueByName(tokens: StatTokenData[]): StatTokenData[] {
  return [...new Map(tokens.map((token) => [token.name, token])).values()];
}
