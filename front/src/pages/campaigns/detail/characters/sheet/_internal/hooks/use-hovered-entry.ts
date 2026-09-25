import { useCallback, useState } from "react";
import type { HoverBinding } from "../types/hover-binding";

export function useHoveredEntry<T>(): HoverBinding<T> {
  const [current, setCurrent] = useState<T | null>(null);
  const onLeave = useCallback(() => setCurrent(null), []);

  return { current, onEnter: setCurrent, onLeave };
}
