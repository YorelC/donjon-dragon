import type { DndCatalog, SkillName } from "@donjon-dragon/shared";
import { allSkillsOf, type CharacterDraft } from "../types/character-draft";
import { classOf, knownSkillsExcept } from "../types/builder-lookups";
import { SkillPickerView } from "./skill-picker.view";

interface SkillChoiceStepViewProps {
  catalog: DndCatalog;
  draft: CharacterDraft;
  onChange: (patch: Partial<CharacterDraft>) => void;
}

/** Les compétences que la classe fait choisir. */
export function ClassSkillsStepView({
  catalog,
  draft,
  onChange,
}: SkillChoiceStepViewProps) {
  const characterClass = classOf({ catalog, draft });
  if (!characterClass) return null;
  const { count, options } = characterClass.skillChoice;

  return (
    <SkillPickerView
      picker={{
        count,
        options: options === "any" ? allSkillsOf(catalog) : options,
        selected: draft.classSkills,
        labels: catalog.skillLabels,
        alreadyKnown: knownSkillsExcept({ catalog, draft }, "class"),
        onChange: (classSkills: SkillName[]) => onChange({ classSkills, expertise: [] }),
      }}
    />
  );
}

/**
 * L'expertise ne s'applique qu'à une compétence déjà maîtrisée : les options
 * sont donc celles que la classe vient de faire choisir.
 */
export function ExpertiseStepView({ catalog, draft, onChange }: SkillChoiceStepViewProps) {
  const characterClass = classOf({ catalog, draft });
  if (!characterClass) return null;

  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">
        Votre bonus de maîtrise est doublé pour les compétences choisies ici.
      </p>
      <SkillPickerView
        picker={{
          count: characterClass.expertiseCount,
          options: draft.classSkills,
          selected: draft.expertise,
          labels: catalog.skillLabels,
          alreadyKnown: [],
          onChange: (expertise: SkillName[]) => onChange({ expertise }),
        }}
      />
    </div>
  );
}
