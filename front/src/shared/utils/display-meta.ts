/**
 * Les deux briques d'affichage que toutes les listes de la charte partagent : le
 * marqueur de donnée absente, et les initiales du médaillon losange.
 *
 * Elles vivent ici parce qu'une ligne de campagne comme une ligne d'ami s'en
 * servent, et qu'aucune page ne lit le `_internal/` d'une autre.
 */
export const MISSING_META = "—";

/** Deux lettres, comme sur le médaillon losange de la charte. */
export function toInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return MISSING_META;

  return trimmed.charAt(0).toUpperCase() + trimmed.charAt(1).toLowerCase();
}
