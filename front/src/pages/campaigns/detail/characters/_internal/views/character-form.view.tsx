import type { AbilityScores, CreateCharacterDto } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/atoms/dialog";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import type { CharacterFormState } from "../hooks/use-character-form";

const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  strength: "Force",
  dexterity: "Dextérité",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Sagesse",
  charisma: "Charisme",
};

interface CharacterFormViewProps {
  form: CharacterFormState;
}

export function CharacterFormView({ form }: CharacterFormViewProps) {
  return (
    <Dialog open={form.open} onOpenChange={form.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {form.editing ? "Modifier le personnage" : "Créer un personnage"}
          </DialogTitle>
        </DialogHeader>
        <IdentityFields form={form} />
        <AbilityScoreFields form={form} />
        <DialogFooter>
          <Button onClick={form.onSubmit} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IdentityFields({ form }: CharacterFormViewProps) {
  const set = (patch: Partial<CreateCharacterDto>) =>
    form.onChange({ ...form.sheet, ...patch });

  return (
    <div className="grid gap-3">
      <Field label="Nom" value={form.sheet.name} onChange={(name) => set({ name })} />
      <Field label="Race" value={form.sheet.race} onChange={(race) => set({ race })} />
      <Field
        label="Classe"
        value={form.sheet.characterClass}
        onChange={(characterClass) => set({ characterClass })}
      />
    </div>
  );
}

function AbilityScoreFields({ form }: CharacterFormViewProps) {
  const set = (key: keyof AbilityScores, value: number) =>
    form.onChange({
      ...form.sheet,
      abilityScores: { ...form.sheet.abilityScores, [key]: value },
    });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {(Object.keys(ABILITY_LABELS) as (keyof AbilityScores)[]).map((key) => (
        <NumberField
          key={key}
          label={ABILITY_LABELS[key]}
          value={form.sheet.abilityScores[key]}
          onChange={(value) => set(key, value)}
        />
      ))}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function Field({ label, value, onChange }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
