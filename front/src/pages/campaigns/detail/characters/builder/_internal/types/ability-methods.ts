import type { AbilityMethod } from "@donjon-dragon/shared";

export interface AbilityMethodOption {
  key: AbilityMethod;
  label: string;
  hint: string;
}

/** Les trois méthodes du manuel, ouvertes à tous. */
export const PLAYER_ABILITY_METHODS: readonly AbilityMethodOption[] = [
  {
    key: "standardArray",
    label: "Valeurs standard",
    hint: "15, 14, 13, 12, 10, 8 — à répartir comme vous voulez.",
  },
  {
    key: "pointBuy",
    label: "Acquisition par points",
    hint: "27 points à dépenser, des scores de 8 à 15. Les hauts scores coûtent plus cher.",
  },
  {
    key: "roll",
    label: "Lancer les dés",
    hint: "Quatre d6, on garde les trois meilleurs, six fois.",
  },
];

const MANUAL_METHOD: AbilityMethodOption = {
  key: "manual",
  label: "Saisie manuelle",
  hint: "Réservée au MJ : saisissez chaque valeur de base entre 3 et 18.",
};

/** Ce que voit le MJ de la campagne : le manuel, plus sa saisie d'arbitrage. */
export const GAME_MASTER_ABILITY_METHODS: readonly AbilityMethodOption[] = [
  ...PLAYER_ABILITY_METHODS,
  MANUAL_METHOD,
];
