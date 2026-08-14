import type { CatalogClass, ClassKey, DndCatalog, SkillName } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Separator } from "@/shared/components/atoms/separator";
import { allSkillsOf, type WizardDraft } from "../types/wizard-draft";
import { OptionListView } from "./option-list.view";
import { SkillPickerView } from "./skill-picker.view";

interface ClassStepViewProps {
  catalog: DndCatalog;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

export function ClassStepView(props: ClassStepViewProps) {
  const { catalog, draft, onChange } = props;
  const characterClass = catalog.classes.find((entry) => entry.key === draft.classKey);

  return (
    <div className="grid gap-4">
      <OptionListView
        options={catalog.classes.map((entry) => ({ key: entry.key, name: entry.name }))}
        selectedKey={draft.classKey}
        onSelect={(key) =>
          onChange({
            classKey: key as ClassKey,
            classSkills: [],
            expertise: [],
            classSpells: [],
          })
        }
      />
      {characterClass ? <ClassDetails {...props} characterClass={characterClass} /> : null}
    </div>
  );
}

interface ClassDetailsProps extends ClassStepViewProps {
  characterClass: CatalogClass;
}

function ClassDetails(props: ClassDetailsProps) {
  return (
    <div className="grid gap-4">
      <Separator />
      <ClassSummary characterClass={props.characterClass} />
      <ClassSkillChoice {...props} />
      <ExpertiseChoice {...props} />
    </div>
  );
}

function ClassSummary({ characterClass }: { characterClass: CatalogClass }) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Badge variant="outline">Dé de vie d{characterClass.hitDie}</Badge>
      <Badge variant="outline">
        Sauvegardes : {characterClass.savingThrows.join(", ")}
      </Badge>
      {characterClass.spellcasting ? (
        <Badge>Incantation ({characterClass.spellcasting.ability})</Badge>
      ) : null}
    </div>
  );
}

function ClassSkillChoice({ catalog, characterClass, draft, onChange }: ClassDetailsProps) {
  const { count, options } = characterClass.skillChoice;

  return (
    <SkillPickerView
      picker={{
        count,
        options: options === "any" ? allSkillsOf(catalog) : options,
        selected: draft.classSkills,
        labels: catalog.skillLabels,
        alreadyKnown: draft.speciesSkills,
        onChange: (classSkills: SkillName[]) => onChange({ classSkills, expertise: [] }),
      }}
    />
  );
}

/** L'expertise ne s'applique qu'à une compétence déjà maîtrisée. */
function ExpertiseChoice({ catalog, characterClass, draft, onChange }: ClassDetailsProps) {
  if (characterClass.expertiseCount === 0) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Expertise</h3>
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
