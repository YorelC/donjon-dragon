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

/** Ce que le personnage porte, parmi ce que son paquetage lui a donné. */
export function WornEquipmentView({ worn, binding }: WornEquipmentViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeading label="Ce que vous portez" />
      <SelectableRow
        entry={{ name: NO_ARMOR_LABEL, meta: "", tag: "" }}
        state={binding.composition.armorKey === null ? "selected" : "idle"}
        actions={{ select: () => binding.onChange({ armorKey: null }) }}
      />
      {worn.armors.map((armor) => (
        <ArmorRow key={armor.key} armor={armor} binding={binding} />
      ))}
      {worn.armors.length === 0 ? (
        <p className="fine-print px-1">Votre paquetage ne contient aucune armure.</p>
      ) : null}
      <ShieldToggle shield={worn.shield} binding={binding} />
    </div>
  );
}

function ArmorRow({ armor, binding }: { armor: Item; binding: StepBinding }) {
  return (
    <SelectableRow
      entry={{
        name: armor.name,
        meta: armor.armor?.stealthDisadvantage ? "Discrétion désavantagée" : "",
        tag: `CA ${armor.armor?.baseArmorClass ?? 0}`,
      }}
      state={binding.composition.armorKey === armor.key ? "selected" : "idle"}
      actions={{ select: () => binding.onChange({ armorKey: armor.key }) }}
    />
  );
}

/** Le bouclier ne se porte que si le paquetage en contient un. */
function ShieldToggle({ shield, binding }: { shield: Item | null; binding: StepBinding }) {
  if (!shield) return null;

  return (
    <div className="flex items-center gap-3 px-1 pt-1">
      <Switch
        id="shield"
        checked={binding.composition.shield}
        onCheckedChange={(checked) => binding.onChange({ shield: checked })}
      />
      <Label htmlFor="shield">
        {shield.name} (+{shield.armor?.baseArmorClass ?? 0} CA)
      </Label>
    </div>
  );
}
