import type { SkillName } from "@donjon-dragon/shared";
import { allSkillsOf } from "../types/character-composition";
import { classOf, knownSkillNames, knownSkillsExcept } from "../types/builder-lookups";
import type { StepBinding } from "../types/step-binding";
import { SkillPickerView } from "./skill-picker.view";

/** Les compétences que la classe fait choisir. */
export function ClassSkillsStepView({ binding }: { binding: StepBinding }) {
  const characterClass = classOf(binding);
  if (!characterClass) return null;
  const { count, options } = characterClass.skillChoice;

  return (
    <SkillPickerView
      picker={{
        count,
        options: options === "any" ? allSkillsOf(binding.catalog) : options,
        selected: binding.composition.classSkills,
        labels: binding.catalog.skillLabels,
        alreadyKnown: knownSkillsExcept(binding, "class"),
        onChange: (classSkills: SkillName[]) => binding.onChange({ classSkills, expertise: [] }),
        onPreview: binding.preview,
      }}
    />
  );
}

/**
 * L'expertise ne s'applique qu'à une compétence déjà maîtrisée, quelle que soit
 * sa source : classe, historique, espèce ou don.
 */
export function ExpertiseStepView({ binding }: { binding: StepBinding }) {
  const characterClass = classOf(binding);
  if (!characterClass) return null;

  return (
    <SkillPickerView
      picker={{
        count: characterClass.expertiseCount,
        options: knownSkillNames(binding),
        selected: binding.composition.expertise,
        labels: binding.catalog.skillLabels,
        alreadyKnown: [],
        onChange: (expertise: SkillName[]) => binding.onChange({ expertise }),
        onPreview: binding.preview,
      }}
    />
  );
}
