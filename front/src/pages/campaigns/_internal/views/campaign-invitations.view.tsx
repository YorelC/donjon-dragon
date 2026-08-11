import type { CampaignInvitation } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { QueryState } from "@/shared/types/ui-state";
import type { InvitationAnswer } from "../hooks/use-invitation-answer";

interface CampaignInvitationsViewProps {
  invitations: QueryState<CampaignInvitation[]>;
  answer: InvitationAnswer;
}

export function CampaignInvitationsView({
  invitations,
  answer,
}: CampaignInvitationsViewProps) {
  if (invitations.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (invitations.error)
    return (
      <div className="empty-state-text">
        Erreur lors du chargement des demandes.
      </div>
    );
  if (invitations.data.length === 0)
    return (
      <div className="empty-state-text">
        Aucune demande de campagne pour le moment.
      </div>
    );

  return (
    <div className="space-y-2">
      {invitations.data.map((invitation) => (
        <InvitationRow
          key={invitation.campaignId}
          invitation={invitation}
          answer={answer}
        />
      ))}
    </div>
  );
}

interface InvitationRowProps {
  invitation: CampaignInvitation;
  answer: InvitationAnswer;
}

function InvitationRow({ invitation, answer }: InvitationRowProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="grid gap-0.5">
          <span className="font-medium">{invitation.name}</span>
          <span className="muted-text-xs">
            Invitation de {invitation.invitedBy.displayName}
          </span>
        </div>
        <InvitationActions invitation={invitation} answer={answer} />
      </CardContent>
    </Card>
  );
}

function InvitationActions({ invitation, answer }: InvitationRowProps) {
  const { campaignId } = invitation;
  const isPending = answer.pendingCampaignId === campaignId;

  return (
    <div className="flex shrink-0 gap-2">
      <Button size="sm" disabled={isPending} onClick={() => answer.onAccept(campaignId)}>
        Accepter
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => answer.onRefuse(campaignId)}
      >
        Refuser
      </Button>
    </div>
  );
}
