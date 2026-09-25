import type { DndCatalog } from "@donjon-dragon/shared";
import { CatalogSelectView } from "./catalog-select.view";

interface TrinketChoiceViewProps {
  trinkets: DndCatalog["trinkets"];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

const NO_TRINKET = "none";

export function TrinketChoiceView(props: TrinketChoiceViewProps) {
  const options = [
    { key: NO_TRINKET, name: "Aucune babiole" },
    ...props.trinkets.map((entry) => ({ key: entry.id.toString(), name: entry.name })),
  ];

  return (
    <CatalogSelectView
      label="Babiole facultative"
      options={options}
      selectedKey={props.selectedId?.toString() ?? NO_TRINKET}
      onSelect={(key) => props.onSelect(key === NO_TRINKET ? null : Number(key))}
    />
  );
}
