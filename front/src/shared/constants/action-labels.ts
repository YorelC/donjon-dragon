/**
 * Les verbes d'action qui reviennent d'un écran à l'autre, écrits une seule fois.
 * Une phrase qui les contient (« Supprimer la campagne ») reste à son écran : elle
 * dit quoi, le verbe seul non.
 */
export const ACTION_LABELS = {
  cancel: "Annuler",
  delete: "Supprimer",
} as const;
