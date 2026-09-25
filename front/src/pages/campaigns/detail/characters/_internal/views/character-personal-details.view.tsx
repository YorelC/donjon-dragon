import { Button } from "@/shared/components/atoms/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import { Textarea } from "@/shared/components/atoms/textarea";

interface CharacterPersonalDetailsViewProps {
  values: { age: string; weightKg: string; description: string };
  isPending: boolean;
  onAgeChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
}

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
    <NumberField id="character-age" label="Âge" value={props.values.age} onChange={props.onAgeChange} />
    <NumberField id="character-weight" label="Poids (kg)" value={props.values.weightKg} onChange={props.onWeightChange} />
    <div className="grid gap-2">
      <Label htmlFor="character-description">Description physique</Label>
      <Textarea id="character-description" value={props.values.description}
        onChange={(event) => props.onDescriptionChange(event.target.value)} />
    </div>
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
    && Number(values.weightKg) > 0;
}
