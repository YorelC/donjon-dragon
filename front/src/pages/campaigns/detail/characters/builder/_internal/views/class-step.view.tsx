import type { ClassKey } from "@donjon-dragon/shared";
import { classChangePatch } from "../types/builder-transitions";
import type { StepBinding } from "../types/step-binding";
import { OptionListView } from "./option-list.view";

/**
 * Le choix de la classe seul ; dé de vie, maîtrises et aptitudes se lisent dans
 * la fiche détaillée. Ses compétences, son expertise, son Style de combat et son
 * Ordre ont chacun leur écran : ce sont des décisions distinctes, et le fil
 * conducteur doit les montrer comme telles.
 */
export function ClassStepView({ binding }: { binding: StepBinding }) {
  return (
    <OptionListView
      list={{
        options: binding.catalog.classes,
        selectedKey: binding.composition.classKey,
        onSelect: (key) => binding.onChange(classChangePatch(key as ClassKey, binding)),
        onPreview: binding.preview,
      }}
    />
  );
}
