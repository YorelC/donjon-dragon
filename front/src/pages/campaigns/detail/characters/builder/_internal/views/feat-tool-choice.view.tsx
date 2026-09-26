import type { CatalogOriginFeat, DndCatalog } from "@donjon-dragon/shared";
import type { CharacterComposition } from "../types/character-composition";
import { toolsKnownBesides } from "../types/known-tools";
import { BoundedChoiceStepView, type BoundedChoice } from "./bounded-choice-step.view";

const SKILLED_FEAT = "skilled";

export interface FeatToolChoiceProps {
  catalog: DndCatalog;
  feat: CatalogOriginFeat;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/**
 * Les outils qu'un don fait choisir (B01-ORI-006). Façonneur et Musicien ont
 * leur propre quota ; Doué partage le sien avec les compétences.
 */
export function FeatToolChoice(props: FeatToolChoiceProps) {
  if (props.feat.toolOptions.length === 0) return null;
  const choice = props.feat.key === SKILLED_FEAT ? skilledTools(props) : featTools(props);

  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">Outils</p>
      <BoundedChoiceStepView choice={choice} />
    </div>
  );
}

function featTools({ catalog, feat, composition, onChange }: FeatToolChoiceProps): BoundedChoice {
  const selected = composition.featToolChoices[feat.key] ?? [];
  return {
    count: feat.toolChoiceCount, options: feat.toolOptions, labels: catalog.toolLabels, selected,
    blocked: toolsKnownBesides({ catalog, composition }, selected),
    onChange: (tools) => onChange({
      featToolChoices: { ...composition.featToolChoices, [feat.key]: tools },
    }),
  };
}

/** Doué : ce que les compétences n'ont pas pris du quota de trois. */
function skilledTools({ catalog, feat, composition, onChange }: FeatToolChoiceProps): BoundedChoice {
  return {
    count: feat.skillOrToolChoiceCount - composition.featSkills.length,
    options: feat.toolOptions, labels: catalog.toolLabels, selected: composition.featTools,
    blocked: toolsKnownBesides({ catalog, composition }, composition.featTools),
    onChange: (featTools) => onChange({ featTools }),
  };
}
