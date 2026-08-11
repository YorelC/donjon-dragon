import { Button } from "@/shared/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
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
          <Input
            id="assign-player"
            value={assign.playerDisplayName}
            onChange={(e) => assign.onChangeDisplayName(e.target.value)}
          />
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
