import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { CampaignId } from './campaign-id';
import { CampaignMember, type CampaignMemberSnapshot } from './campaign-member';
import { CampaignName } from './campaign-name';
import { CAMPAIGN_ROLE, type CampaignRole } from './campaign-role';
import {
  AlreadyCampaignMemberError,
  AlreadyGameMasterError,
  CannotDemoteLastGameMasterError,
  CannotDemoteOwnerError,
  CannotInviteSelfError,
  CannotLeaveAsLastGameMasterError,
  CannotRemoveGameMasterError,
  CannotRemoveOwnerError,
  CannotRemoveSelfError,
  CannotSelfDemoteAsLastGameMasterError,
  CannotTransferToSelfError,
  MemberNotFoundError,
  NoPendingCampaignInvitationError,
  NotAGameMasterError,
  NotCampaignGameMasterError,
  NotCampaignMemberError,
  NotCampaignOwnerError,
  SuccessorRequiredError,
} from './campaign.errors';

/**
 * État brut de la campagne. Seule frontière par laquelle la persistance et le HTTP
 * lisent l'agrégat — leurs mappers respectifs partent de là.
 */
export interface CampaignSnapshot {
  id: string;
  name: string;
  ownerId: string;
  members: CampaignMemberSnapshot[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Aggregate root d'une campagne.
 *
 * Les invitations ne sont pas une collection à part : un invité est un membre
 * `pending` du même document. C'est ce qui permet à l'agrégat de porter seul les
 * règles d'appartenance — qui peut inviter, qui peut répondre, qui peut partir —
 * sans dépendre de la cohérence entre deux documents.
 *
 * Deux axes indépendants s'y croisent. Le RÔLE dit ce qu'on fait dans la partie ;
 * la PROPRIÉTÉ dit à qui appartient la campagne. Le propriétaire peut n'être que
 * joueur, et reste le seul à pouvoir supprimer. Les confondre reviendrait à
 * laisser deux maîtres du jeu déposséder celui qui a créé la campagne.
 *
 * Un utilisateur n'apparaît qu'une fois, avec un seul rôle.
 */
export class Campaign {
  private constructor(
    readonly id: CampaignId,
    readonly name: CampaignName,
    private currentOwnerId: UserId,
    private currentMembers: readonly CampaignMember[],
    readonly createdAt: string,
    private currentUpdatedAt: string,
  ) {}

  /** Le créateur en est le premier maître du jeu ET le propriétaire. */
  static create(name: CampaignName, founderId: UserId, now: Date): Campaign {
    const createdAt = now.toISOString();
    return new Campaign(
      CampaignId.create(randomUUID()),
      name,
      founderId,
      [CampaignMember.founder(founderId)],
      createdAt,
      createdAt,
    );
  }

  /** Réhydratation depuis la persistance : aucun invariant rejoué. */
  static restore(snapshot: CampaignSnapshot): Campaign {
    return new Campaign(
      CampaignId.create(snapshot.id),
      CampaignName.create(snapshot.name),
      ownerIdOf(snapshot),
      snapshot.members.map((member) => CampaignMember.restore(member)),
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  get ownerId(): UserId {
    return this.currentOwnerId;
  }

  get members(): readonly CampaignMember[] {
    return this.currentMembers;
  }

  get updatedAt(): string {
    return this.currentUpdatedAt;
  }

  /** Seul un maître du jeu invite. L'amitié, elle, se vérifie hors de l'agrégat. */
  invite(inviterId: UserId, inviteeId: UserId, now: Date): void {
    this.assertIsGameMaster(inviterId);
    if (inviterId.equals(inviteeId)) throw new CannotInviteSelfError();
    if (this.memberFor(inviteeId)) throw new AlreadyCampaignMemberError();

    const invitee = CampaignMember.invited(inviteeId, inviterId);
    this.commit([...this.currentMembers, invitee], now);
  }

  acceptInvitation(userId: UserId, now: Date): void {
    const invitation = this.pendingInvitationFor(userId);
    const members = this.currentMembers.map((member) =>
      member === invitation ? member.activated() : member,
    );

    this.commit(members, now);
  }

  /** Un refus ne laisse rien : le membre `pending` disparaît, réinvitation possible. */
  refuseInvitation(userId: UserId, now: Date): void {
    const invitation = this.pendingInvitationFor(userId);
    this.commit(this.without(invitation), now);
  }

  promote(actorId: UserId, targetId: UserId, now: Date): void {
    this.assertIsGameMaster(actorId);
    const target = this.activeTarget(targetId);
    if (target.isGameMaster()) throw new AlreadyGameMasterError();

    this.replace(target, target.withRole(CAMPAIGN_ROLE.gameMaster), now);
  }

  demote(actorId: UserId, targetId: UserId, now: Date): void {
    this.assertIsGameMaster(actorId);
    const target = this.activeTarget(targetId);
    if (!target.isGameMaster()) throw new NotAGameMasterError();
    if (this.isOwner(targetId)) throw new CannotDemoteOwnerError();
    if (this.gameMasters().length === ONLY_ONE) {
      throw new CannotDemoteLastGameMasterError();
    }

    this.replace(target, target.withRole(CAMPAIGN_ROLE.player), now);
  }

  /** Le propriétaire s'auto-promeut : `promote` exige un acteur déjà MJ. */
  selfPromoteAsOwner(actorId: UserId, now: Date): void {
    this.assertIsOwner(actorId);
    const target = this.activeTarget(actorId);
    if (target.isGameMaster()) throw new AlreadyGameMasterError();

    this.replace(target, target.withRole(CAMPAIGN_ROLE.gameMaster), now);
  }

  /** Le propriétaire repasse joueur : `demote` interdit de le viser. */
  selfDemoteAsOwner(actorId: UserId, now: Date): void {
    this.assertIsOwner(actorId);
    const target = this.activeTarget(actorId);
    if (!target.isGameMaster()) throw new NotAGameMasterError();
    if (this.gameMasters().length === ONLY_ONE) {
      throw new CannotSelfDemoteAsLastGameMasterError();
    }

    this.replace(target, target.withRole(CAMPAIGN_ROLE.player), now);
  }

  /** Retire un joueur ou annule son invitation — les deux sont le même geste. */
  removeMember(actorId: UserId, targetId: UserId, now: Date): void {
    this.assertIsGameMaster(actorId);
    if (actorId.equals(targetId)) throw new CannotRemoveSelfError();

    const target = this.memberTarget(targetId);
    if (this.isOwner(targetId)) throw new CannotRemoveOwnerError();
    if (target.isGameMaster()) throw new CannotRemoveGameMasterError();

    this.commit(this.without(target), now);
  }

  /** Passe la main sans toucher au rôle : les deux axes restent indépendants. */
  transferOwnership(actorId: UserId, newOwnerId: UserId, now: Date): void {
    this.assertIsOwner(actorId);
    if (actorId.equals(newOwnerId)) throw new CannotTransferToSelfError();
    this.activeTarget(newOwnerId);

    this.currentOwnerId = newOwnerId;
    this.touch(now);
  }

  leave(actorId: UserId, successorId: UserId | null, now: Date): void {
    const member = this.activeMemberFor(actorId);
    if (member.isGameMaster() && this.gameMasters().length === ONLY_ONE) {
      throw new CannotLeaveAsLastGameMasterError();
    }
    if (this.isOwner(actorId)) this.handOver(actorId, successorId, now);

    this.commit(this.without(member), now);
  }

  assertIsGameMaster(userId: UserId): void {
    if (!this.activeMemberFor(userId).isGameMaster()) {
      throw new NotCampaignGameMasterError();
    }
  }

  assertIsOwner(userId: UserId): void {
    if (!this.isOwner(userId)) throw new NotCampaignOwnerError();
  }

  /** Charge puis vérifie : lire une campagne suppose d'y appartenir. */
  assertIsActiveMember(userId: UserId): void {
    this.activeMemberFor(userId);
  }

  isOwner(userId: UserId): boolean {
    return this.currentOwnerId.equals(userId);
  }

  roleOf(userId: UserId): CampaignRole {
    return this.activeMemberFor(userId).role;
  }

  gameMasters(): UserId[] {
    return this.activeMembers()
      .filter((member) => member.isGameMaster())
      .map((member) => member.userId);
  }

  players(): UserId[] {
    return this.activeMembers()
      .filter((member) => !member.isGameMaster())
      .map((member) => member.userId);
  }

  pendingInvitees(): UserId[] {
    return this.currentMembers
      .filter((member) => member.isPending())
      .map((member) => member.userId);
  }

  /** L'invitation d'un utilisateur, pour en lire l'inviteur. Lève si elle n'existe pas. */
  pendingInvitationFor(userId: UserId): CampaignMember {
    const member = this.memberFor(userId);
    if (!member?.isPending()) throw new NoPendingCampaignInvitationError();

    return member;
  }

  snapshot(): CampaignSnapshot {
    return {
      id: this.id.value,
      name: this.name.value,
      ownerId: this.currentOwnerId.value,
      members: this.currentMembers.map((member) => member.snapshot()),
      createdAt: this.createdAt,
      updatedAt: this.currentUpdatedAt,
    };
  }

  /** Le départ du propriétaire et le transfert sont une seule écriture. */
  private handOver(
    actorId: UserId,
    successorId: UserId | null,
    now: Date,
  ): void {
    if (!successorId) throw new SuccessorRequiredError();

    this.transferOwnership(actorId, successorId, now);
  }

  private activeMembers(): CampaignMember[] {
    return this.currentMembers.filter((member) => member.isActive());
  }

  private memberFor(userId: UserId): CampaignMember | undefined {
    return this.currentMembers.find((member) => member.is(userId));
  }

  /** Un invité qui n'a pas répondu n'est pas encore membre : il ne peut rien faire. */
  private activeMemberFor(userId: UserId): CampaignMember {
    const member = this.memberFor(userId);
    if (!member?.isActive()) throw new NotCampaignMemberError();

    return member;
  }

  /**
   * La CIBLE d'une action, par opposition à son auteur. Elle lève un
   * `MemberNotFoundError` là où `activeMemberFor` lève un `NotCampaignMemberError` :
   * « il n'est pas là » et « ce n'est pas chez toi » ne se répondent pas pareil.
   */
  private memberTarget(userId: UserId): CampaignMember {
    const member = this.memberFor(userId);
    if (!member) throw new MemberNotFoundError();

    return member;
  }

  private activeTarget(userId: UserId): CampaignMember {
    const member = this.memberTarget(userId);
    if (!member.isActive()) throw new MemberNotFoundError();

    return member;
  }

  private without(excluded: CampaignMember): CampaignMember[] {
    return this.currentMembers.filter((member) => member !== excluded);
  }

  private replace(
    previous: CampaignMember,
    updated: CampaignMember,
    now: Date,
  ): void {
    const members = this.currentMembers.map((member) =>
      member === previous ? updated : member,
    );

    this.commit(members, now);
  }

  private commit(members: readonly CampaignMember[], now: Date): void {
    this.currentMembers = members;
    this.touch(now);
  }

  private touch(now: Date): void {
    this.currentUpdatedAt = now.toISOString();
  }
}

const ONLY_ONE = 1;

/**
 * Compatibilité de lecture, pas une règle du domaine : les campagnes créées avant
 * la notion de propriétaire n'ont pas d'`ownerId` en base. Le fondateur étant le
 * premier maître du jeu, c'est lui qu'on retrouve.
 */
function ownerIdOf(snapshot: CampaignSnapshot): UserId {
  return UserId.create(snapshot.ownerId ?? firstGameMasterId(snapshot.members));
}

function firstGameMasterId(members: CampaignMemberSnapshot[]): string {
  const gameMaster = members.find(
    (member) => member.role === CAMPAIGN_ROLE.gameMaster,
  );

  // Aucun maître du jeu : le document est corrompu, UserId.create le dira.
  return gameMaster?.userId ?? '';
}
