import { Button } from "@/shared/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/atoms/dialog";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import type { CharacterFormState } from "../hooks/use-character-form";

interface CharacterFormViewProps {
  form: CharacterFormState;
}

export function CharacterFormView({ form }: CharacterFormViewProps) {
  return (
    <Dialog open={form.open} onOpenChange={form.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {form.editing ? "Renommer le personnage" : "Créer un personnage"}
          </DialogTitle>
          <DialogDescription>
            {form.editing
              ? "Seul le nom change ici."
              : "Le nom suffit pour commencer : espèce, classe et historique se choisissent ensuite."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="character-name">Nom</Label>
          <Input
            id="character-name"
            value={form.name}
            onChange={(event) => form.onChange(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={form.onSubmit} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
