import type {
  CampaignCharacterListItem,
  CampaignDetail,
  UserSummary,
} from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import type { MemberManagement } from "../hooks/use-member-management";
import {
  toMemberCharacterLine,
  type CharacterReader,
} from "../utils/member-character";
import {
  MemberRowView,
  type MemberKind,
  type MemberRow,
  type MemberViewer,
} from "./member-row.view";

interface CampaignMembersViewProps {
  campaign: CampaignDetail;
  characters: CampaignCharacterListItem[];
  viewer: MemberViewer;
  management: MemberManagement;
}

export function CampaignMembersView({
  campaign,
  characters,
  viewer,
  management,
}: CampaignMembersViewProps) {
  const roster = toRoster(campaign, characters, viewer);

  return (
    <div className="flex flex-col gap-[22px]">
      {toSections(campaign, roster).map((section) => (
        <MemberSection
          key={section.title}
          section={section}
          crew={{ viewer, management }}
        />
      ))}
    </div>
  );
}

interface Crew {
  viewer: MemberViewer;
  management: MemberManagement;
}

interface MemberSectionData {
  title: string;
  members: MemberRow[];
}

function MemberSection({
  section,
  crew,
}: {
  section: MemberSectionData;
  crew: Crew;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading label={section.title} />
      <MemberList members={section.members} crew={crew} />
    </section>
  );
}

function MemberList({ members, crew }: { members: MemberRow[]; crew: Crew }) {
  if (members.length === 0) {
    return <p className="empty-state-text">Personne pour le moment.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {members.map((member) => (
        <MemberRowView
          key={member.displayName}
          member={member}
          viewer={crew.viewer}
          management={crew.management}
        />
      ))}
    </ul>
  );
}

/** Ce qu'il faut savoir de la table pour décrire une ligne : le tenancier, les
 *  fiches, et ce que le lecteur a le droit d'en apprendre. */
interface Roster {
  owner: UserSummary;
  characters: CampaignCharacterListItem[];
  reader: CharacterReader;
}

function toRoster(
  campaign: CampaignDetail,
  characters: CampaignCharacterListItem[],
  viewer: MemberViewer,
): Roster {
  return {
    owner: campaign.owner,
    characters,
    reader: {
      displayName: viewer.displayName,
      seesEveryAssignment: viewer.canManage,
    },
  };
}

function toSections(
  campaign: CampaignDetail,
  roster: Roster,
): MemberSectionData[] {
  return [
    {
      title: "Maîtres du jeu",
      members: toRows(campaign.gameMasters, "gameMaster", roster),
    },
    { title: "Joueurs", members: toRows(campaign.players, "player", roster) },
    {
      title: "Invitations en attente",
      members: toRows(campaign.pendingInvitees, "pending", roster),
    },
  ];
}

function toRows(
  members: UserSummary[],
  kind: MemberKind,
  roster: Roster,
): MemberRow[] {
  return members.map((member) => ({
    displayName: member.displayName,
    isOwner: member.displayName === roster.owner.displayName,
    kind,
    meta: toMeta(member.displayName, kind, roster),
  }));
}

/** Un invité n'est pas encore à la table : il n'y mène aucun personnage. */
function toMeta(
  displayName: string,
  kind: MemberKind,
  roster: Roster,
): string | undefined {
  if (kind === "pending") return undefined;

  return toMemberCharacterLine(displayName, roster.characters, roster.reader);
}
