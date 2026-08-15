import { Button } from "@/shared/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { Label } from "@/shared/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/atoms/select";
import type { AssignCharacterFormState } from "../hooks/use-assign-character-form";

interface CharacterAssignViewProps {
  assign: AssignCharacterFormState;
}

export function CharacterAssignView({ assign }: CharacterAssignViewProps) {
  return (
    <Dialog open={assign.open} onOpenChange={assign.onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Attribuer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attribuer ce personnage</DialogTitle>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="assign-player">Pseudo du joueur</Label>
          <Select value={assign.playerDisplayName} onValueChange={assign.onChangeDisplayName}>
            <SelectTrigger id="assign-player" className="w-full">
              <SelectValue placeholder="Choisir un joueur" />
            </SelectTrigger>
            <SelectContent>
              {assign.playerOptions.map((displayName) => (
                <SelectItem key={displayName} value={displayName}>
                  {displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            onClick={assign.onSubmit}
            disabled={!assign.playerDisplayName || assign.isSubmitting}
          >
            {assign.isSubmitting ? "Attribution..." : "Attribuer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
