import type {
  CampaignDetail,
  CampaignInvitation,
  CampaignSummary,
} from '@donjon-dragon/shared/campaign-schema';
import type { UserSummary } from '@donjon-dragon/shared/user-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Campaign } from '../domain/campaign';
import type { CampaignInvitation as InvitationAggregate } from '../domain/campaign-invitation';
import type { DirectoryUser } from './ports/campaign-directory.port';
import type { CampaignCreationResult } from './ports/campaign.repository.port';

/**
 * Agrégat → contrat HTTP. Aucun `userId` n'en sort : le client n'a pas à connaître
 * l'identité système des autres joueurs. Des compteurs suffisent à la liste, le
 * détail d'une campagne donne les pseudos.
 *
 * `myRole` et `isOwner` se lisent du point de vue de CELUI qui demande : la même
 * campagne se résume différemment selon le lecteur.
 */
export function toCampaignSummary(
  campaign: Campaign,
  viewerId: UserId,
): CampaignSummary {
  return {
    id: campaign.id.value,
    name: campaign.name.value,
    myRole: campaign.roleOf(viewerId),
    isOwner: campaign.isOwner(viewerId),
    gameMasterCount: campaign.gameMasters().length,
    playerCount: campaign.players().length,
  };
}

/**
 * Le créateur est le premier propriétaire, et le seul membre : personne d'autre ne
 * peut recevoir ce résumé, mais on le calcule quand même plutôt que de l'affirmer.
 */
export function creationResultToSummary(
  result: CampaignCreationResult,
  viewerId: UserId,
): CampaignSummary {
  const isOwner = result.ownerUserId === viewerId.value;

  return {
    id: result.campaignId,
    name: result.name,
    myRole: isOwner ? 'gameMaster' : 'player',
    isOwner,
    gameMasterCount: result.gameMasterCount,
    playerCount: result.playerCount,
  };
}

/**
 * L'inviteur arrive déjà résolu : c'est le use-case qui décide quoi faire d'une
 * invitation dont l'inviteur est introuvable, et sa décision est de ne pas la
 * montrer. Le mapper, lui, ne branche sur rien.
 */
export function toCampaignInvitation(
  invitation: InvitationAggregate,
  campaign: Campaign,
  inviter: DirectoryUser,
): CampaignInvitation {
  return {
    campaignId: invitation.campaignId.value,
    name: campaign.name.value,
    invitedBy: { displayName: inviter.displayName },
  };
}

/**
 * L'annuaire arrive résolu en une fois : le use-case fait UNE lecture pour tous
 * les membres, le mapper ne fait qu'y piocher.
 *
 * `isOwner` est calculé côté serveur et non déduit d'une comparaison de pseudos
 * par le client : c'est un droit, pas un affichage.
 */
interface CampaignDetailProjection {
  campaign: Campaign;
  viewerId: UserId;
  directory: DirectoryUser[];
  pendingInvitees: UserId[];
}

export function toCampaignDetail(projection: CampaignDetailProjection): CampaignDetail {
  const { campaign, viewerId, directory, pendingInvitees } = projection;
  const byId = new Map(directory.map((user) => [user.id, user]));

  return {
    id: campaign.id.value,
    revision: campaign.revision,
    name: campaign.name.value,
    myRole: campaign.roleOf(viewerId),
    isOwner: campaign.isOwner(viewerId),
    owner: toSummary(campaign.ownerId, byId),
    gameMasters: toSummaries(campaign.gameMasters(), byId),
    players: toSummaries(campaign.players(), byId),
    pendingInvitees: toSummaries(pendingInvitees, byId),
  };
}

/** Les identifiants à résoudre pour afficher une campagne, sans doublon. */
export function everyoneIn(campaign: Campaign, pendingInvitees: UserId[]): string[] {
  const userIds = [
    campaign.ownerId,
    ...campaign.gameMasters(),
    ...campaign.players(),
    ...pendingInvitees,
  ];

  return [...new Set(userIds.map((userId) => userId.value))];
}

/**
 * Un membre introuvable dans l'annuaire garde sa place, contrairement à une
 * invitation dont l'inviteur a disparu, qu'on masque. Le retirer ici ferait
 * mentir les listes du détail sur qui est dans la campagne.
 */
const UNKNOWN_MEMBER = 'Compte introuvable';

function toSummary(
  userId: UserId,
  byId: Map<string, DirectoryUser>,
): UserSummary {
  return { displayName: byId.get(userId.value)?.displayName ?? UNKNOWN_MEMBER };
}

function toSummaries(
  userIds: UserId[],
  byId: Map<string, DirectoryUser>,
): UserSummary[] {
  return userIds.map((userId) => toSummary(userId, byId));
}
