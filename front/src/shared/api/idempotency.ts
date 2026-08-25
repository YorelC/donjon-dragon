import { IDEMPOTENCY_KEY_HEADER } from "@donjon-dragon/shared";
import type { CommandHeaders } from "./api";

/**
 * Une commande utilisateur reçoit une clé neuve. Le rejeu interne après renouvellement
 * de session réutilise le même objet d'options, donc la même clé : c'est ce qui rend le
 * rejeu inoffensif côté serveur.
 */
export function commandHeaders(): CommandHeaders {
  return { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() };
}
