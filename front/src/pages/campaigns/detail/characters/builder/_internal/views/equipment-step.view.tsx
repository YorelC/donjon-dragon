import type { DndCatalog, Item } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Switch } from "@/shared/components/atoms/switch";
import { Label } from "@/shared/components/atoms/label";
import type { CharacterComposition } from "../types/character-composition";
import {
  backgroundEquipmentOptions,
  classEquipmentOptions,
  grantedItems,
  ownedArmors,
  ownedShield,
} from "../types/starting-equipment";
import { EquipmentOptionGroupView } from "./equipment-option-group.view";

interface EquipmentStepViewProps {
  catalog: DndCatalog;
  items: Item[];
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/**
 * L'équipement de départ des règles 2024 : on prend l'option A, B ou C de sa
 * classe et celle de son historique, ou bien l'or. On ne choisit pas son armure
 * dans une vitrine — on porte ce que le paquetage a donné.
 */
export function EquipmentStepView({
  catalog,
  items,
  composition,
  onChange,
}: EquipmentStepViewProps) {
  const granted = grantedItems(catalog, composition);

  return (
    <div className="grid gap-6">
      <EquipmentOptionGroupView
        title="Paquetage de classe"
        options={classEquipmentOptions(catalog, composition)}
        selectedId={composition.classEquipmentOptionId}
        selection={{
          items,
          onSelect: (optionId) => onChange(resetWorn({ classEquipmentOptionId: optionId })),
        }}
      />
      <EquipmentOptionGroupView
        title="Paquetage d'historique"
        options={backgroundEquipmentOptions(catalog, composition)}
        selectedId={composition.backgroundEquipmentOptionId}
        selection={{
          items,
          onSelect: (optionId) => onChange(resetWorn({ backgroundEquipmentOptionId: optionId })),
        }}
      />
      <WornEquipment
        worn={{ armors: ownedArmors(items, granted), shield: ownedShield(items, granted) }}
        composition={composition}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * Changer d'option change ce qu'on possède : garder l'armure précédente ferait
 * porter au personnage une pièce qui ne lui appartient plus.
 */
function resetWorn(patch: Partial<CharacterComposition>): Partial<CharacterComposition> {
  return { ...patch, armorKey: null, shield: false };
}

interface WornEquipmentProps {
  worn: { armors: Item[]; shield: Item | null };
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

function WornEquipment({ worn, composition, onChange }: WornEquipmentProps) {
  return (
    <div className="grid gap-3">
      <h3 className="section-title text-sm">Ce que vous portez</h3>
      <ArmorChoice worn={worn} composition={composition} onChange={onChange} />
      {worn.armors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Votre paquetage ne contient aucune armure.
        </p>
      ) : null}
      <ShieldToggle worn={worn} composition={composition} onChange={onChange} />
    </div>
  );
}

function ArmorChoice({ worn, composition, onChange }: WornEquipmentProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={composition.armorKey === null ? "default" : "outline"}
        onClick={() => onChange({ armorKey: null })}
      >
        Sans armure
      </Button>
      {worn.armors.map((armor) => (
        <ArmorButton
          key={armor.key}
          armor={armor}
          selected={composition.armorKey === armor.key}
          onSelect={() => onChange({ armorKey: armor.key })}
        />
      ))}
    </div>
  );
}

interface ArmorButtonProps {
  armor: Item;
  selected: boolean;
  onSelect: () => void;
}

function ArmorButton({ armor, selected, onSelect }: ArmorButtonProps) {
  return (
    <Button type="button" size="sm" variant={selected ? "default" : "outline"} onClick={onSelect}>
      {armor.name}
      <Badge variant="secondary" className="ml-2">
        CA {armor.armor?.baseArmorClass ?? 0}
      </Badge>
      {armor.armor?.stealthDisadvantage ? (
        <Badge variant="outline" className="ml-2">
          Discrétion désavantagée
        </Badge>
      ) : null}
    </Button>
  );
}

/** Le bouclier ne se porte que si le paquetage en contient un. */
function ShieldToggle({ worn, composition, onChange }: WornEquipmentProps) {
  if (!worn.shield) return null;

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="shield"
        checked={composition.shield}
        onCheckedChange={(shield) => onChange({ shield })}
      />
      <Label htmlFor="shield">
        {worn.shield.name} (+{worn.shield.armor?.baseArmorClass ?? 0} CA)
      </Label>
    </div>
  );
}
