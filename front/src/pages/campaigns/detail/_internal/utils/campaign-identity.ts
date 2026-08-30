import type { CampaignDetail, CampaignRole } from "@donjon-dragon/shared";

/** Le pied de la barre latérale : ma place à cette table, et son effectif. */
export interface CampaignIdentity {
  roleLabel: string;
  membersLabel: string;
}

export function toCampaignIdentity(campaign: CampaignDetail): CampaignIdentity {
  return {
    roleLabel: ROLE_LABELS[campaign.myRole],
    membersLabel: toMembersLabel(campaign),
  };
}

const ROLE_LABELS: Record<CampaignRole, string> = {
  gameMaster: "Maître du jeu",
  player: "Joueur",
};

function toMembersLabel(campaign: CampaignDetail): string {
  const members = pluralize(toMemberCount(campaign), "membre", "membres");
  const pending = campaign.pendingInvitees.length;
  // Rien en attente : la mention disparaît au lieu d'annoncer un zéro.
  if (pending === 0) return members;

  return `${members} · ${pluralize(pending, "invitation", "invitations")} en attente`;
}

function toMemberCount(campaign: CampaignDetail): number {
  return campaign.gameMasters.length + campaign.players.length;
}

const PLURAL_FROM = 2;

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count >= PLURAL_FROM ? plural : singular}`;
}
