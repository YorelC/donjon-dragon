import { useCallback, useState } from "react";
import type { SelectionBinding } from "../types/selection-binding";
import { useHoveredEntry } from "./use-hovered-entry";

/** Cliquer une entrée l'épingle, la cliquer de nouveau la relâche. */
export function usePinnedEntry<T>(): SelectionBinding<T> {
  const hover = useHoveredEntry<T>();
  const [pinned, setPinned] = useState<T | null>(null);
  const onSelect = useCallback(
    (entry: T) => setPinned((current) => (current === entry ? null : entry)),
    [],
  );

  return {
    shown: hover.current ?? pinned,
    pinned,
    onEnter: hover.onEnter,
    onLeave: hover.onLeave,
    onSelect,
  };
}
