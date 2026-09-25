import type { ResolvedAttack } from "@donjon-dragon/shared";
import { useHoveredEntry } from "../hooks/use-hovered-entry";
import { WeaponsTabView } from "../views/weapons-tab.view";

export function WeaponsTabContainer({ attacks }: { attacks: ResolvedAttack[] }) {
  const hover = useHoveredEntry<ResolvedAttack>();

  return <WeaponsTabView attacks={attacks} hover={hover} />;
}
