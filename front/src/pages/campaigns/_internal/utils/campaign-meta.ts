import type { CampaignSummary } from "@donjon-dragon/shared";

/**
 * Ce qu'on affiche sous le nom d'une campagne — et rien d'autre.
 *
 * Le serveur ne connaît ni séance hebdomadaire, ni mise en pause, ni le pseudo du
 * maître du jeu : le résumé n'en dit donc rien plutôt que de l'inventer. Seuls les
 * effectifs sont réels. Même règle que pour les amis, voir `display-meta.ts`.
 */
export function toCampaignHeadcount(campaign: CampaignSummary): string {
  const gameMasters = pluralize(
    campaign.gameMasterCount,
    "maître du jeu",
    "maîtres du jeu",
  );

  return `${gameMasters} · ${pluralize(campaign.playerCount, "joueur", "joueurs")}`;
}

const PLURAL_FROM = 2;

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count >= PLURAL_FROM ? plural : singular}`;
}
