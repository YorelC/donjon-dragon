import { z } from 'zod';

import { displayNameField, UserSummarySchema } from './user-schema.js';

/**
 * Bornes du nom de campagne, en un seul endroit — le back valide avec ce schéma,
 * le formulaire du front réutilise `CreateCampaignSchema.shape.name`.
 *
 * Aucune unicité : deux campagnes peuvent porter le même nom, y compris chez le
 * même maître de jeu. Ce qui les distingue est leur `id`.
 */
export const CAMPAIGN_NAME_RULES = {
  min: 10,
  max: 50,
} as const;

export const campaignNameField = () =>
  z
    .string()
    .trim()
    .min(CAMPAIGN_NAME_RULES.min, {
      message: `Le nom de la campagne doit contenir au moins ${CAMPAIGN_NAME_RULES.min} caractères.`,
    })
    .max(CAMPAIGN_NAME_RULES.max, {
      message: `Le nom de la campagne ne peut pas dépasser ${CAMPAIGN_NAME_RULES.max} caractères.`,
    });

/**
 * Un membre porte UN seul rôle. Un maître de jeu n'apparaît donc jamais dans la
 * liste des joueurs : les deux sections de l'affichage sont disjointes.
 */
export const CampaignRoleEnum = z.enum(['gameMaster', 'player']);

/**
 * Une invitation en attente n'est pas une collection à part : c'est un membre
 * `pending`. L'acceptation le passe en `active`, le refus le retire.
 */
export const MembershipStatusEnum = z.enum(['pending', 'active']);

export const CreateCampaignSchema = z.object({
  name: campaignNameField(),
});

/**
 * Ce que le client reçoit dans l'onglet « Mes campagnes en cours ».
 *
 * Aucun `userId` n'en sort — même raison que pour les amitiés : le client n'a pas
 * à connaître l'identité système des autres joueurs. Des compteurs suffisent ici,
 * le détail d'une campagne donne les pseudos.
 */
export const CampaignSummarySchema = z.object({
  id: z.string().uuid(),
  name: campaignNameField(),
  myRole: CampaignRoleEnum,
  gameMasterCount: z.number().int().min(1),
  playerCount: z.number().int().min(0),
});

/**
 * Ce que le client reçoit d'une campagne ouverte. `pendingInvitees` est la liste
 * des invitations que le maître de jeu a envoyées et qui n'ont pas encore de
 * réponse : sans elle, il invite quelqu'un et ne voit rien changer.
 *
 * `owner` sert à poser le badge sur la bonne ligne — tout le monde le voit, c'est
 * ce qui explique pourquoi certaines actions ne sont pas proposées sur lui.
 * `isOwner` est redondant en apparence seulement : un DROIT ne se déduit pas
 * d'une comparaison de pseudos côté client. Même rôle que `myRole`, qui dit déjà
 * la position du lecteur.
 */
export const CampaignDetailSchema = z.object({
  id: z.string().uuid(),
  name: campaignNameField(),
  myRole: CampaignRoleEnum,
  isOwner: z.boolean(),
  owner: UserSummarySchema,
  gameMasters: z.array(UserSummarySchema),
  players: z.array(UserSummarySchema),
  pendingInvitees: z.array(UserSummarySchema),
});

// ── Invitations ─────────────────────────────────────────────────────────────

/**
 * Le front envoie le pseudo de l'invité, pas son id : il ne le connaît pas, et
 * n'a pas à le connaître. Même raison que pour `SendFriendRequestSchema`.
 */
export const InviteToCampaignSchema = z.object({
  displayName: displayNameField(),
});

/**
 * Ce que le client reçoit dans l'onglet « Demandes de campagne ».
 *
 * `campaignId` est le handle de l'action — c'est lui qu'on accepte ou refuse.
 * `invitedBy` est l'ami qui a invité : c'est ce qui rend la demande lisible,
 * une campagne inconnue n'ayant sinon aucun contexte.
 */
export const CampaignInvitationSchema = z.object({
  campaignId: z.string().uuid(),
  name: campaignNameField(),
  invitedBy: UserSummarySchema,
});

export const PendingCampaignInvitationCountSchema = z.object({
  count: z.number().int().min(0),
});

// ── Propriété et départ ─────────────────────────────────────────────────────

/** Le successeur est désigné par son pseudo, comme tout membre côté client. */
export const TransferOwnershipSchema = z.object({
  displayName: displayNameField(),
});

/**
 * Le successeur voyage AVEC le départ, et non dans un appel séparé : un
 * propriétaire qui part doit passer la main, et deux requêtes laisseraient, en
 * cas d'échec de la seconde, la propriété déplacée et le partant encore là.
 *
 * Optionnel parce qu'un membre qui n'est pas propriétaire n'a personne à
 * désigner. C'est le domaine qui exige le successeur quand il le faut — la
 * dépendance entre deux champs n'appartient pas au schéma de transport.
 */
export const LeaveCampaignSchema = z.object({
  successorDisplayName: displayNameField().optional(),
});

export type CampaignRole = z.infer<typeof CampaignRoleEnum>;
export type MembershipStatus = z.infer<typeof MembershipStatusEnum>;
export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>;
export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;
export type CampaignDetail = z.infer<typeof CampaignDetailSchema>;
export type InviteToCampaignDto = z.infer<typeof InviteToCampaignSchema>;
export type CampaignInvitation = z.infer<typeof CampaignInvitationSchema>;
export type PendingCampaignInvitationCount = z.infer<
  typeof PendingCampaignInvitationCountSchema
>;
export type TransferOwnershipDto = z.infer<typeof TransferOwnershipSchema>;
export type LeaveCampaignDto = z.infer<typeof LeaveCampaignSchema>;
