import type { ResolvedEquipment, ResolvedItem } from "@donjon-dragon/shared";
import { usePinnedEntry } from "../hooks/use-pinned-entry";
import { GearTabView } from "../views/gear-tab.view";

export function GearTabContainer({ equipment }: { equipment: ResolvedEquipment }) {
  const selection = usePinnedEntry<ResolvedItem>();

  return <GearTabView equipment={equipment} selection={selection} />;
}
