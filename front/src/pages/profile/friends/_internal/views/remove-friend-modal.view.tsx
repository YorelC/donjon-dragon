import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/atoms/dialog";
import { Button } from "@/shared/components/atoms/button";

interface RemoveFriendModalViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendDisplayName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function RemoveFriendModalView({
  open,
  onOpenChange,
  friendDisplayName,
  onConfirm,
  isDeleting,
}: RemoveFriendModalViewProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer un ami</DialogTitle>
          <DialogDescription>
            Voulez-vous vraiment supprimer {friendDisplayName} ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
