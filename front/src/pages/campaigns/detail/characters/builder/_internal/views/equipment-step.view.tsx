import type { CatalogArmor, DndCatalog } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Switch } from "@/shared/components/atoms/switch";
import { Label } from "@/shared/components/atoms/label";
import type { CharacterComposition } from "../types/character-composition";

interface EquipmentStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

export function EquipmentStepView({ catalog, composition, onChange }: EquipmentStepViewProps) {
  const characterClass = catalog.classes.find((entry) => entry.key === composition.classKey);

  return (
    <div className="grid gap-4">
      {characterClass ? (
        <p className="text-sm text-muted-foreground">
          Paquetage de départ : {characterClass.startingEquipment.description}
        </p>
      ) : null}
      <ArmorChoice catalog={catalog} composition={composition} onChange={onChange} />
      <ShieldToggle catalog={catalog} composition={composition} onChange={onChange} />
    </div>
  );
}

/**
 * Seules l'armure et le bouclier entrent dans une formule au niveau 1 : c'est
 * pour ça qu'ils se choisissent ici, et que le reste du paquetage reste du texte.
 *
 * On ne propose que ce que la classe sait porter — un magicien n'a aucune
 * maîtrise d'armure et ne voit donc que « Sans armure ».
 */
function ArmorChoice({ catalog, composition, onChange }: EquipmentStepViewProps) {
  const wearable = wearableArmors(catalog, composition);

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Armure portée</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={composition.armorKey === null ? "default" : "outline"}
          onClick={() => onChange({ armorKey: null })}
        >
          Sans armure
        </Button>
        {wearable.map((armor) => (
          <ArmorButton
            key={armor.key}
            armor={armor}
            selected={composition.armorKey === armor.key}
            onSelect={() => onChange({ armorKey: armor.key })}
          />
        ))}
      </div>
      {wearable.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cette classe ne maîtrise aucune armure.
        </p>
      ) : null}
    </div>
  );
}

function wearableArmors(catalog: DndCatalog, composition: CharacterComposition): CatalogArmor[] {
  const training = catalog.classes.find((entry) => entry.key === composition.classKey)
    ?.armorTraining;
  if (!training) return [];

  return catalog.armors.filter((armor) => training.includes(armor.training));
}

interface ArmorButtonProps {
  armor: CatalogArmor;
  selected: boolean;
  onSelect: () => void;
}

function ArmorButton({ armor, selected, onSelect }: ArmorButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      onClick={onSelect}
    >
      {armor.name}
      <Badge variant="secondary" className="ml-2">
        CA {armor.baseArmorClass}
      </Badge>
    </Button>
  );
}

/** Le bouclier est une maîtrise à part : sans elle, on ne le propose pas. */
function ShieldToggle({ catalog, composition, onChange }: EquipmentStepViewProps) {
  const training = catalog.classes.find((entry) => entry.key === composition.classKey)
    ?.armorTraining;
  if (!training?.includes("shields")) return null;

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="shield"
        checked={composition.shield}
        onCheckedChange={(shield) => onChange({ shield })}
      />
      <Label htmlFor="shield">
        Bouclier (+{catalog.shieldArmorClassBonus} CA)
      </Label>
    </div>
  );
}
