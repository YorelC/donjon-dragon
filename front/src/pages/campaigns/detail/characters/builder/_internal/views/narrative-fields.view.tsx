import { CHARACTER_NARRATIVE_DETAIL_RULES } from "@donjon-dragon/shared";
import { Label } from "@/shared/components/atoms/label";
import { Textarea } from "@/shared/components/atoms/textarea";
import type { CharacterComposition } from "../types/character-composition";
import type { StepBinding } from "../types/step-binding";

type NarrativeKey = "personalityTraits" | "ideals" | "bonds" | "flaws";

const NARRATIVE_FIELDS: readonly { key: NarrativeKey; label: string }[] = [
  { key: "personalityTraits", label: "Traits de personnalité" },
  { key: "ideals", label: "Idéaux" },
  { key: "bonds", label: "Liens" },
  { key: "flaws", label: "Défauts" },
];

export function NarrativeFieldsView({ composition, onChange }: StepBinding) {
  return (
    <div className="grid gap-4">
      {NARRATIVE_FIELDS.map((field) => (
        <NarrativeField
          key={field.key}
          field={field}
          value={composition[field.key]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

interface NarrativeFieldProps {
  field: { key: NarrativeKey; label: string };
  value: string | null;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

function NarrativeField({ field, value, onChange }: NarrativeFieldProps) {
  const id = `character-${field.key}`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{field.label} (facultatif)</Label>
      <Textarea
        id={id}
        value={value ?? ""}
        maxLength={CHARACTER_NARRATIVE_DETAIL_RULES.max}
        onChange={(event) => onChange({ [field.key]: event.target.value || null })}
      />
    </div>
  );
}
