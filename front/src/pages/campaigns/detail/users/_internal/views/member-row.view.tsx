import type { ReactElement } from "react";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import { toInitials } from "@/shared/utils/display-meta";
import type { MemberManagement } from "../hooks/use-member-management";

export type MemberKind = "gameMaster" | "player" | "pending";

export interface MemberRow {
  displayName: string;
  isOwner: boolean;
  kind: MemberKind;
  /** Le personnage mené à cette table, quand le lecteur a le droit de le savoir. */
  meta?: string;
}

export interface MemberViewer {
  displayName: string;
  canManage: boolean;
}

interface MemberRowProps {
  member: MemberRow;
  viewer: MemberViewer;
  management: MemberManagement;
}

export function MemberRowView({ member, viewer, management }: MemberRowProps) {
  return (
    <li className="list-row">
      <MemberIdentity member={member} />
      <div className="flex shrink-0 items-center gap-2.5">
        <PendingMark kind={member.kind} />
        <MemberActions
          member={member}
          viewer={viewer}
          management={management}
        />
      </div>
    </li>
  );
}

function MemberIdentity({ member }: { member: MemberRow }) {
  return (
    <div className="flex min-w-0 items-center gap-[18px]">
      <MemberMedallion member={member} />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-[15px] tracking-name text-foreground">
            {member.displayName}
          </span>
          {member.isOwner ? <Badge variant="stamp">Propriétaire</Badge> : null}
        </div>
        {member.meta ? (
          <span className="meta-line truncate">{member.meta}</span>
        ) : null}
      </div>
    </div>
  );
}

/** L'or du médaillon dit le rôle. Un invité n'en porte pas : il n'est pas à la table. */
function MemberMedallion({ member }: { member: MemberRow }) {
  const tone = MEDALLION_TONES[member.kind];
  if (tone === null) return null;

  return (
    <Diamond size="badge" tone={tone}>
      {toInitials(member.displayName)}
    </Diamond>
  );
}

function PendingMark({ kind }: { kind: MemberKind }) {
  if (kind !== "pending") return null;

  return <span className="pill">En attente</span>;
}

/**
 * Le propriétaire est intouchable et on n'agit pas sur soi-même : plutôt que de
 * laisser le serveur refuser, on ne propose rien. Le badge Propriétaire explique
 * l'absence de boutons sur sa ligne.
 */
function MemberActions({ member, viewer, management }: MemberRowProps) {
  if (!viewer.canManage) return null;
  if (member.isOwner || member.displayName === viewer.displayName) return null;

  const Actions = ACTIONS_BY_KIND[member.kind];

  return <Actions member={member} management={management} />;
}

interface ActionsProps {
  member: MemberRow;
  management: MemberManagement;
}

function DemoteAction({ member, management }: ActionsProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isBusy(member, management)}
      onClick={() => management.onDemote(member.displayName)}
    >
      Rétrograder
    </Button>
  );
}

function PlayerActions({ member, management }: ActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Button
        size="sm"
        disabled={isBusy(member, management)}
        onClick={() => management.onPromote(member.displayName)}
      >
        Promouvoir
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isBusy(member, management)}
        onClick={() => management.onRemove(member.displayName)}
      >
        Retirer
      </Button>
    </div>
  );
}

/** « Annuler » suffit sur la ligne ; hors contexte, il faut dire quoi. */
function CancelInvitationAction({ member, management }: ActionsProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={`Annuler l'invitation de ${member.displayName}`}
      disabled={isBusy(member, management)}
      onClick={() => management.onCancelInvitation(member.displayName)}
    >
      Annuler
    </Button>
  );
}

/** Trois natures de ligne, donc un objet de dispatch et non une cascade de `if`. */
const ACTIONS_BY_KIND: Record<
  MemberKind,
  (props: ActionsProps) => ReactElement
> = {
  gameMaster: DemoteAction,
  player: PlayerActions,
  pending: CancelInvitationAction,
};

const MEDALLION_TONES: Record<MemberKind, "active" | "idle" | null> = {
  gameMaster: "active",
  player: "idle",
  pending: null,
};

function isBusy(member: MemberRow, management: MemberManagement): boolean {
  return management.pendingDisplayName === member.displayName;
}
