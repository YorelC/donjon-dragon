import type { DndCatalog, SkillName } from "@donjon-dragon/shared";
import { allSkillsOf, type CharacterComposition } from "../types/character-composition";
import { classOf, knownSkillNames, knownSkillsExcept } from "../types/builder-lookups";
import { SkillPickerView } from "./skill-picker.view";

interface SkillChoiceStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/** Les compétences que la classe fait choisir. */
export function ClassSkillsStepView({
  catalog,
  composition,
  onChange,
}: SkillChoiceStepViewProps) {
  const characterClass = classOf({ catalog, composition });
  if (!characterClass) return null;
  const { count, options } = characterClass.skillChoice;

  return (
    <SkillPickerView
      picker={{
        count,
        options: options === "any" ? allSkillsOf(catalog) : options,
        selected: composition.classSkills,
        labels: catalog.skillLabels,
        alreadyKnown: knownSkillsExcept({ catalog, composition }, "class"),
        onChange: (classSkills: SkillName[]) => onChange({ classSkills, expertise: [] }),
      }}
    />
  );
}

/**
 * L'expertise ne s'applique qu'à une compétence déjà maîtrisée, quelle que soit
 * sa source : classe, historique, espèce ou don.
 */
export function ExpertiseStepView({ catalog, composition, onChange }: SkillChoiceStepViewProps) {
  const characterClass = classOf({ catalog, composition });
  if (!characterClass) return null;

  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">
        Votre bonus de maîtrise est doublé pour les compétences choisies ici.
      </p>
      <SkillPickerView
        picker={{
          count: characterClass.expertiseCount,
          options: knownSkillNames({ catalog, composition }),
          selected: composition.expertise,
          labels: catalog.skillLabels,
          alreadyKnown: [],
          onChange: (expertise: SkillName[]) => onChange({ expertise }),
        }}
      />
    </div>
  );
}
