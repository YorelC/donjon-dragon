import type { BackgroundKey } from "@donjon-dragon/shared";
import { backgroundChangePatch } from "../types/builder-transitions";
import type { StepBinding } from "../types/step-binding";
import { OptionListView } from "./option-list.view";

/**
 * Le choix de l'historique seul. Ses bonus de caractéristique se posent à
 * l'étape des Caractéristiques, là où l'on voit leur effet sur les scores ; son
 * don, ses compétences et son outil se lisent dans la fiche détaillée.
 */
export function BackgroundStepView({ binding }: { binding: StepBinding }) {
  return (
    <OptionListView
      list={{
        options: binding.catalog.backgrounds,
        selectedKey: binding.composition.backgroundKey,
        onSelect: (key) => binding.onChange(backgroundChangePatch(key as BackgroundKey, binding)),
        onPreview: binding.preview,
      }}
    />
  );
}
