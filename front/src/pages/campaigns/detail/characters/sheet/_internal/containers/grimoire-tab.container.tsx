import type { ComputedCharacter } from "@donjon-dragon/shared";
import type { CastableSpell } from "../constants/sheet-labels";
import { usePinnedEntry } from "../hooks/use-pinned-entry";
import { GrimoireTabView } from "../views/grimoire-tab.view";

export function GrimoireTabContainer({ sheet }: { sheet: ComputedCharacter }) {
  const selection = usePinnedEntry<CastableSpell>();

  return <GrimoireTabView sheet={sheet} selection={selection} />;
}
