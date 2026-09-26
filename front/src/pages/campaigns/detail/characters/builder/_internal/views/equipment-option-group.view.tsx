import type { CatalogEquipmentOption } from "@donjon-dragon/shared";
import { SelectableRow } from "@/shared/components/molecules/selectable-row";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import {
  EQUIPMENT_GROUP_TITLES,
  equipmentFocusKey,
  type EquipmentGroup,
} from "../types/equipment-detail";
import { EquipmentItemChoiceView } from "./equipment-item-choice.view";

export interface EquipmentSelection {
  selectedId: string | null;
  selectedItemKey: string | null;
  onSelect: (optionId: string) => void;
  onItemSelect: (itemKey: string) => void;
  /** Montre l'option et son contenu dans la fiche détaillée. */
  onPreview: (focusKey: string) => void;
}

interface EquipmentOptionGroupProps {
  group: EquipmentGroup;
  options: CatalogEquipmentOption[];
  selection: EquipmentSelection;
}

/**
 * Un choix de paquetage : les options du manuel, dont la dernière est toujours
 * « tout en or ». C'est le seul choix que le joueur fait ici — l'inventaire en
 * découle, et se lit dans la fiche détaillée.
 */
export function EquipmentOptionGroupView({ group, options, selection }: EquipmentOptionGroupProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <SectionHeading label={EQUIPMENT_GROUP_TITLES[group]} />
      {options.map((option) => (
        <EquipmentOptionRow key={option.id} group={group} option={option} selection={selection} />
      ))}
    </div>
  );
}

interface EquipmentOptionRowProps {
  group: EquipmentGroup;
  option: CatalogEquipmentOption;
  selection: EquipmentSelection;
}

/**
 * Les deux paquetages nomment leurs options « A » et « B ». Sans le groupe dans
 * l'identifiant, les deux « A » partagent un id DOM, et le parcours e2e ne sait
 * plus lequel choisir.
 */
function EquipmentOptionRow({ group, option, selection }: EquipmentOptionRowProps) {
  const selected = option.id === selection.selectedId;

  return (
    <>
      <SelectableRow
        entry={{
          id: `equipment-option-${group}-${option.id}`,
          name: `Option ${option.id}`,
          meta: option.label,
          tag: option.gold > 0 ? `${option.gold} po` : "",
        }}
        state={selected ? "selected" : "idle"}
        actions={{
          select: () => selection.onSelect(option.id),
          preview: () => selection.onPreview(equipmentFocusKey(group, option.id)),
        }}
      />
      {selected && option.itemChoice ? (
        <EquipmentItemChoiceView
          choice={option.itemChoice}
          selectedKey={selection.selectedItemKey}
          onSelect={selection.onItemSelect}
        />
      ) : null}
    </>
  );
}
