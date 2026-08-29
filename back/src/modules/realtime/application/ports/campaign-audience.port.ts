export const CAMPAIGN_AUDIENCE = Symbol('CAMPAIGN_AUDIENCE');

/**
 * Ce que le relais a besoin de savoir d'une campagne : à qui adresser un fait
 * dont l'audience dépend d'une adhésion.
 *
 * Le contrat temps réel impose que ces destinataires soient recalculés depuis
 * les données autoritaires à CHAQUE émission. Le port ne rend donc jamais un
 * cache : c'est une lecture, faite au moment de la diffusion.
 */
export interface CampaignAudiencePort {
  activeMemberIds(campaignId: string): Promise<readonly string[]>;
  activeGameMasterIds(campaignId: string): Promise<readonly string[]>;
}
