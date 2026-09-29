import { useEffect, useRef, useState } from "react";

export interface JournalSelection {
  selectedId: string | null;
  select: (chapterId: string) => void;
}

const FIRST_INDEX = 0;

/**
 * Le chapitre ouvert : le premier à l'arrivée ; après une suppression, celui qui
 * prend sa place, ou le précédent s'il était le dernier. Un chapitre ouvert par
 * repli est aussitôt retenu comme choisi : réordonner ne l'échange pas contre
 * celui qui prendrait sa place.
 */
export function useJournalSelection(chapterIds: readonly string[]): JournalSelection {
  const [chosenId, select] = useState<string | null>(null);
  const lastIndex = useRef(FIRST_INDEX);
  const chosenIndex = chosenId === null ? -1 : chapterIds.indexOf(chosenId);

  useEffect(() => {
    if (chosenIndex >= FIRST_INDEX) lastIndex.current = chosenIndex;
  }, [chosenIndex]);

  const fallback = Math.min(lastIndex.current, chapterIds.length - 1);
  const selectedId = chosenIndex >= FIRST_INDEX ? chosenId : (chapterIds[fallback] ?? null);

  useEffect(() => {
    if (selectedId !== null && selectedId !== chosenId) select(selectedId);
  }, [selectedId, chosenId]);
  return { selectedId, select };
}
