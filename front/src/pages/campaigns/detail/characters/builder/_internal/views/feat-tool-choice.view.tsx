import type { CatalogOriginFeat, DndCatalog } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import type { CharacterComposition } from "../types/character-composition";
import { toolsKnownBesides } from "../types/known-tools";
import {
  BoundedChoiceOptionsView,
  BoundedChoiceStepView,
  type BoundedChoice,
} from "./bounded-choice-step.view";

export interface FeatToolChoiceProps {
  catalog: DndCatalog;
  feat: CatalogOriginFeat;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/**
 * Les outils qu'un don fait choisir (B01-ORI-006). Façonneur et Musicien ont
 * leur propre quota ; un don comme Doué, qui mêle compétences et outils, le
 * partage avec ses compétences.
 */
export function FeatToolChoice(props: FeatToolChoiceProps) {
  if (props.feat.toolOptions.length === 0) return null;
  if (sharesQuotaWithSkills(props.feat)) return <SharedQuotaTools {...props} />;

  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">Outils</p>
      <BoundedChoiceStepView choice={ownQuotaTools(props)} />
    </div>
  );
}

/**
 * Un seul compteur pour le quota partagé : deux compteurs qui se vident l'un
 * l'autre finissaient par annoncer « Choisissez 0 option ».
 */
function SharedQuotaTools(props: FeatToolChoiceProps) {
  const { feat, composition } = props;
  const chosen = composition.featSkills.length + composition.featTools.length;

  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">
        Outils — {feat.skillOrToolChoiceCount} maîtrises au total, compétences et outils
        confondus{" "}
        <Badge variant="outline">{chosen} / {feat.skillOrToolChoiceCount}</Badge>
      </p>
      <BoundedChoiceOptionsView choice={sharedQuotaTools(props)} />
    </div>
  );
}

function sharesQuotaWithSkills(feat: CatalogOriginFeat): boolean {
  return feat.skillOrToolChoiceCount > 0;
}

function ownQuotaTools({ catalog, feat, composition, onChange }: FeatToolChoiceProps): BoundedChoice {
  const selected = composition.featToolChoices[feat.key] ?? [];
  return {
    count: feat.toolChoiceCount, options: feat.toolOptions, labels: catalog.toolLabels, selected,
    blocked: toolsKnownBesides({ catalog, composition }, selected),
    onChange: (tools) => onChange({
      featToolChoices: { ...composition.featToolChoices, [feat.key]: tools },
    }),
  };
}

/** Ce que les compétences n'ont pas pris du quota partagé. */
function sharedQuotaTools({ catalog, feat, composition, onChange }: FeatToolChoiceProps): BoundedChoice {
  return {
    count: feat.skillOrToolChoiceCount - composition.featSkills.length,
    options: feat.toolOptions, labels: catalog.toolLabels, selected: composition.featTools,
    blocked: toolsKnownBesides({ catalog, composition }, composition.featTools),
    onChange: (featTools) => onChange({ featTools }),
  };
}
