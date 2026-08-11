import type { CampaignDetail, UserSummary } from "@donjon-dragon/shared";
import type { MemberManagement } from "../hooks/use-member-management";
import {
  MemberRowView,
  type MemberKind,
  type MemberRow,
  type MemberViewer,
} from "./member-row.view";

interface CampaignMembersViewProps {
  campaign: CampaignDetail;
  viewer: MemberViewer;
  management: MemberManagement;
}

export function CampaignMembersView({
  campaign,
  viewer,
  management,
}: CampaignMembersViewProps) {
  return (
    <div className="space-y-6">
      <MemberSection
        title="Maîtres du jeu"
        members={toRows(campaign.gameMasters, "gameMaster", campaign.owner)}
        crew={{ viewer, management }}
      />
      <MemberSection
        title="Joueurs"
        members={toRows(campaign.players, "player", campaign.owner)}
        crew={{ viewer, management }}
      />
      <MemberSection
        title="Invitations en attente"
        members={toRows(campaign.pendingInvitees, "pending", campaign.owner)}
        crew={{ viewer, management }}
      />
    </div>
  );
}

interface Crew {
  viewer: MemberViewer;
  management: MemberManagement;
}

interface MemberSectionProps {
  title: string;
  members: MemberRow[];
  crew: Crew;
}

function MemberSection({ title, members, crew }: MemberSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="section-title text-base">{title}</h2>
      {members.length === 0 ? (
        <p className="empty-state-text">Personne pour le moment.</p>
      ) : null}
      {members.map((member) => (
        <MemberRowView
          key={member.displayName}
          member={member}
          viewer={crew.viewer}
          management={crew.management}
        />
      ))}
    </section>
  );
}

function toRows(
  members: UserSummary[],
  kind: MemberKind,
  owner: UserSummary,
): MemberRow[] {
  return members.map((member) => ({
    displayName: member.displayName,
    isOwner: member.displayName === owner.displayName,
    kind,
  }));
}
