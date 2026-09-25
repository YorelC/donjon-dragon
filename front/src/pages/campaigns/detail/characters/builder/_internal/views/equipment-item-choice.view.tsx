import type { CatalogEquipmentOption } from "@donjon-dragon/shared";
import { CatalogSelectView } from "./catalog-select.view";

interface EquipmentItemChoiceViewProps {
  choice: NonNullable<CatalogEquipmentOption["itemChoice"]>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function EquipmentItemChoiceView(props: EquipmentItemChoiceViewProps) {
  return (
    <CatalogSelectView
      label="Objet concret du paquetage"
      options={props.choice.options}
      selectedKey={props.selectedKey}
      onSelect={props.onSelect}
    />
  );
}
