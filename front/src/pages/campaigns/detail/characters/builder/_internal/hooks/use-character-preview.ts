import { useEffect, useRef, useState } from "react";
import type { ComputedCharacter } from "@donjon-dragon/shared";
import { usePreviewSheet } from "../queries/use-character-creation";
import type { CharacterComposition } from "../types/character-composition";
import { toPreviewPayload } from "../types/character-payload";

/** Le temps qu'un joueur met à finir de cliquer avant qu'un appel parte. */
const DEBOUNCE_MS = 350;

/**
 * L'aperçu vient du serveur, jamais d'un calcul local : c'est ce qui garantit
 * qu'un seul endroit connaît les règles. Débouncé, parce qu'un clic sur une
 * compétence n'a pas à déclencher un aller-retour immédiat.
 *
 * Le payload sérialisé sert de dépendance : deux compositions identiques ne
 * doivent pas relancer la requête, et `composition` est un objet neuf à chaque
 * frappe.
 */
export function useCharacterPreview(
  campaignId: string,
  composition: CharacterComposition,
): ComputedCharacter | null {
  const [sheet, setSheet] = useState<ComputedCharacter | null>(null);
  const request = useLatestPreview(campaignId);
  const payload = JSON.stringify(toPreviewPayload(composition));

  useEffect(() => schedulePreview(payload, request, setSheet), [payload, request]);

  return sheet;
}

type PreviewRequest = ReturnType<typeof usePreviewSheet>["mutate"];

/** La mutation change d'identité à chaque rendu : on n'en garde que la dernière. */
function useLatestPreview(campaignId: string): PreviewRequest {
  const preview = usePreviewSheet(campaignId);
  const latest = useRef(preview.mutate);
  latest.current = preview.mutate;

  return useRef<PreviewRequest>((payload, options) =>
    latest.current(payload, options),
  ).current;
}

function schedulePreview(
  payload: string,
  request: PreviewRequest,
  onSheet: (sheet: ComputedCharacter) => void,
): () => void {
  const parsed = payload === "null" ? null : JSON.parse(payload);
  if (!parsed) return () => undefined;

  const timer = setTimeout(() => request(parsed, { onSuccess: onSheet }), DEBOUNCE_MS);

  return () => clearTimeout(timer);
}
