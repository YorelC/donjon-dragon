import { Button } from "@/shared/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { Label } from "@/shared/components/atoms/label";
import { Diamond } from "@/shared/components/molecules/diamond";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/atoms/select";
import type { InviteToCampaignFormState } from "../hooks/use-invite-to-campaign-form";

const FRIEND_SELECT_ID = "campaign-invite-friend";

interface InviteToCampaignViewProps {
  invite: InviteToCampaignFormState;
}

export function InviteToCampaignView({ invite }: InviteToCampaignViewProps) {
  return (
    <Dialog open={invite.open} onOpenChange={invite.onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Diamond tone="filled" />
          Inviter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un ami</DialogTitle>
          <DialogDescription>
            Seuls tes amis peuvent rejoindre une campagne. Ajoute d'abord un
            joueur en ami depuis ton profil.
          </DialogDescription>
        </DialogHeader>
        <FriendPicker invite={invite} />
        <InviteFooter invite={invite} />
      </DialogContent>
    </Dialog>
  );
}

function FriendPicker({ invite }: InviteToCampaignViewProps) {
  if (invite.friends.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (invite.friends.error)
    return (
      <div className="empty-state-text">
        Erreur lors du chargement de tes amis.
      </div>
    );
  // Deux causes mènent ici : aucun ami, ou tous déjà dans la campagne. Le message
  // les couvre toutes les deux plutôt que d'en affirmer une au hasard.
  if (invite.friends.data.length === 0)
    return (
      <div className="empty-state-text">
        Aucun ami à inviter : ils font déjà tous partie de la campagne, ou tu
        n'en as pas encore.
      </div>
    );

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={FRIEND_SELECT_ID}>Ami à inviter</Label>
      <Select
        value={invite.selectedDisplayName || undefined}
        onValueChange={invite.onSelect}
      >
        <SelectTrigger id={FRIEND_SELECT_ID}>
          <SelectValue placeholder="Choisis un ami" />
        </SelectTrigger>
        <SelectContent>
          {invite.friends.data.map((friend) => (
            <SelectItem key={friend.friendshipId} value={friend.friend.displayName}>
              {friend.friend.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InviteFooter({ invite }: InviteToCampaignViewProps) {
  return (
    <DialogFooter>
      <Button
        onClick={invite.onSubmit}
        disabled={!invite.selectedDisplayName || invite.isSubmitting}
      >
        {invite.isSubmitting ? "Envoi..." : "Inviter"}
      </Button>
    </DialogFooter>
  );
}
