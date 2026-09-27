import type { ReactElement } from "react";
import type { Item } from "@donjon-dragon/shared";
import { Label } from "@/shared/components/atoms/label";
import { Switch } from "@/shared/components/atoms/switch";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { SelectableRow } from "@/shared/components/molecules/selectable-row";
import type { StepBinding } from "../types/step-binding";

interface WornEquipment {
  armors: Item[];
  shield: Item | null;
}

interface WornEquipmentViewProps {
  worn: WornEquipment;
  binding: StepBinding;
}

const NO_ARMOR_LABEL = "Sans armure";
const STEALTH_DISADVANTAGE = "Discrétion désavantagée";

type ArmorCount = "none" | "single" | "several";

/**
 * Ce que le personnage porte, parmi ce que son paquetage lui a donné : une
 * armure au plus, et un bouclier en plus. Les deux se cumulent.
 */
export function WornEquipmentView({ worn, binding }: WornEquipmentViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeading label="Ce que vous portez" />
      <ArmorChoice worn={worn} binding={binding} />
      {worn.shield ? <ShieldToggle shield={worn.shield} binding={binding} /> : null}
    </div>
  );
}

/** Une seule armure se porte ou non ; entre plusieurs, on en choisit une. */
function ArmorChoice({ worn, binding }: WornEquipmentViewProps) {
  const choices: Record<ArmorCount, () => ReactElement> = {
    none: () => <p className="fine-print px-1">Votre paquetage ne contient aucune armure.</p>,
    single: () => <ArmorToggle armor={worn.armors[0] as Item} binding={binding} />,
    several: () => <ArmorRows armors={worn.armors} binding={binding} />,
  };

  return choices[armorCountOf(worn.armors)]();
}

function ArmorToggle({ armor, binding }: { armor: Item; binding: StepBinding }) {
  return (
    <WearToggle
      toggle={{
        id: `wear-${armor.key}`,
        label: armorLabelOf(armor),
        checked: binding.composition.armorKey === armor.key,
        onToggle: (worn) => binding.onChange({ armorKey: worn ? armor.key : null }),
      }}
    />
  );
}

function ShieldToggle({ shield, binding }: { shield: Item; binding: StepBinding }) {
  return (
    <WearToggle
      toggle={{
        id: "shield",
        label: `${shield.name} (+${shield.armor?.baseArmorClass ?? 0} CA)`,
        checked: binding.composition.shield,
        onToggle: (worn) => binding.onChange({ shield: worn }),
      }}
    />
  );
}

interface WearToggleState {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (worn: boolean) => void;
}

function WearToggle({ toggle }: { toggle: WearToggleState }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-1">
      <Switch id={toggle.id} checked={toggle.checked} onCheckedChange={toggle.onToggle} />
      <Label htmlFor={toggle.id}>{toggle.label}</Label>
    </div>
  );
}

function ArmorRows({ armors, binding }: { armors: Item[]; binding: StepBinding }) {
  return (
    <>
      <SelectableRow
        entry={{ name: NO_ARMOR_LABEL, meta: "", tag: "" }}
        state={binding.composition.armorKey === null ? "selected" : "idle"}
        actions={{ select: () => binding.onChange({ armorKey: null }) }}
      />
      {armors.map((armor) => (
        <ArmorRow key={armor.key} armor={armor} binding={binding} />
      ))}
    </>
  );
}

function ArmorRow({ armor, binding }: { armor: Item; binding: StepBinding }) {
  return (
    <SelectableRow
      entry={{
        name: armor.name,
        meta: armor.armor?.stealthDisadvantage ? STEALTH_DISADVANTAGE : "",
        tag: `CA ${armor.armor?.baseArmorClass ?? 0}`,
      }}
      state={binding.composition.armorKey === armor.key ? "selected" : "idle"}
      actions={{ select: () => binding.onChange({ armorKey: armor.key }) }}
    />
  );
}

function armorCountOf(armors: readonly Item[]): ArmorCount {
  if (armors.length === 0) return "none";

  return armors.length === 1 ? "single" : "several";
}

function armorLabelOf(armor: Item): string {
  const stealth = armor.armor?.stealthDisadvantage ? ` · ${STEALTH_DISADVANTAGE}` : "";

  return `${armor.name} (CA ${armor.armor?.baseArmorClass ?? 0})${stealth}`;
}
