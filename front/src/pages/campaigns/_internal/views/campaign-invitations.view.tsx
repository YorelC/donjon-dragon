import type { CampaignInvitation } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import type { QueryState } from "@/shared/types/ui-state";
import { toInitials } from "@/shared/utils/display-meta";
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
    <ul className="flex flex-col gap-2.5">
      {invitations.data.map((invitation) => (
        <InvitationRow
          key={invitation.campaignId}
          invitation={invitation}
          answer={answer}
        />
      ))}
    </ul>
  );
}

interface InvitationRowProps {
  invitation: CampaignInvitation;
  answer: InvitationAnswer;
}

/** Ton « en attente » : la ligne est mise en avant parce qu'elle attend une réponse. */
function InvitationRow({ invitation, answer }: InvitationRowProps) {
  return (
    <li className="flex items-center justify-between gap-5 border border-gold/28 bg-gold/5 px-5 py-4">
      <InvitationIdentity invitation={invitation} />
      <InvitationActions invitation={invitation} answer={answer} />
    </li>
  );
}

function InvitationIdentity({ invitation }: { invitation: CampaignInvitation }) {
  return (
    <div className="flex min-w-0 items-center gap-[18px]">
      <Diamond size="badge" tone="active">
        {toInitials(invitation.name)}
      </Diamond>
      <div className="flex min-w-0 flex-col gap-[5px]">
        <span className="truncate font-display text-base tracking-meta text-gold-title">
          {invitation.name}
        </span>
        <span className="meta-line truncate">
          Invitation de {invitation.invitedBy.displayName}
        </span>
      </div>
    </div>
  );
}

function InvitationActions({ invitation, answer }: InvitationRowProps) {
  const { campaignId } = invitation;
  const isPending = answer.pendingCampaignId === campaignId;

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Button disabled={isPending} onClick={() => answer.onAccept(campaignId)}>
        Rejoindre
      </Button>
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => answer.onRefuse(campaignId)}
      >
        Refuser
      </Button>
    </div>
  );
}
