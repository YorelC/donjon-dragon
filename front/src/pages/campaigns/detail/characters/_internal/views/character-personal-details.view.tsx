import { Button } from "@/shared/components/atoms/button";
import { CHARACTER_NARRATIVE_DETAIL_RULES } from "@donjon-dragon/shared";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import { Textarea } from "@/shared/components/atoms/textarea";

interface CharacterPersonalDetailsViewProps {
  values: EditablePersonalDetailsValues;
  isPending: boolean;
  onChange: (field: keyof EditablePersonalDetailsValues, value: string) => void;
  onSubmit: () => void;
}

export interface EditablePersonalDetailsValues {
  age: string;
  weightKg: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  description: string;
}

const NARRATIVE_FIELDS = [
  ["personalityTraits", "Traits de personnalité"],
  ["ideals", "Idéaux"],
  ["bonds", "Liens"],
  ["flaws", "Défauts"],
] as const;

export function CharacterPersonalDetailsView(props: CharacterPersonalDetailsViewProps) {
  return <Dialog>
    <DialogTrigger asChild><Button size="sm" variant="outline">Détails</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Modifier les données personnelles</DialogTitle>
        <DialogDescription>Le nom, l’alignement, l’origine et la taille restent inchangés.</DialogDescription>
      </DialogHeader>
      <PersonalDetailsFields {...props} />
      <DialogFooter>
        <Button onClick={props.onSubmit} disabled={props.isPending || !isValid(props.values)}>
          Enregistrer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function PersonalDetailsFields(props: CharacterPersonalDetailsViewProps) {
  return <div className="grid gap-4">
    <NumberField id="character-age" label="Âge" value={props.values.age}
      onChange={(value) => props.onChange("age", value)} />
    <NumberField id="character-weight" label="Poids (kg)" value={props.values.weightKg}
      onChange={(value) => props.onChange("weightKg", value)} />
    {NARRATIVE_FIELDS.map(([field, label]) => (
      <TextField key={field} id={`character-${field}`} label={label}
        value={props.values[field]} onChange={(value) => props.onChange(field, value)} />
    ))}
    <TextField id="character-description" label="Description physique"
      value={props.values.description} onChange={(value) => props.onChange("description", value)} />
  </div>;
}

function TextField(props: NumberFieldProps) {
  return <div className="grid gap-2">
    <Label htmlFor={props.id}>{props.label} (facultatif)</Label>
    <Textarea id={props.id} value={props.value} maxLength={CHARACTER_NARRATIVE_DETAIL_RULES.max}
      onChange={(event) => props.onChange(event.target.value)} />
  </div>;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function NumberField(props: NumberFieldProps) {
  return <div className="grid gap-2">
    <Label htmlFor={props.id}>{props.label}</Label>
    <Input id={props.id} type="number" min="1" step="1" value={props.value}
      onChange={(event) => props.onChange(event.target.value)} />
  </div>;
}

function isValid(values: CharacterPersonalDetailsViewProps["values"]): boolean {
  return Number.isInteger(Number(values.age))
    && Number(values.age) > 0
    && Number(values.weightKg) > 0
    && narrativeLengthsAreValid(values);
}

function narrativeLengthsAreValid(values: EditablePersonalDetailsValues): boolean {
  const narratives = NARRATIVE_FIELDS.map(([field]) => values[field]);
  return [...narratives, values.description]
    .every((value) => value.trim().length <= CHARACTER_NARRATIVE_DETAIL_RULES.max);
}
