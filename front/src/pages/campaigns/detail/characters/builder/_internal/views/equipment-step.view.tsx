import type { CatalogArmor, DndCatalog } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Switch } from "@/shared/components/atoms/switch";
import { Label } from "@/shared/components/atoms/label";
import type { CharacterDraft } from "../types/character-draft";

interface EquipmentStepViewProps {
  catalog: DndCatalog;
  draft: CharacterDraft;
  onChange: (patch: Partial<CharacterDraft>) => void;
}

export function EquipmentStepView({ catalog, draft, onChange }: EquipmentStepViewProps) {
  const characterClass = catalog.classes.find((entry) => entry.key === draft.classKey);

  return (
    <div className="grid gap-4">
      {characterClass ? (
        <p className="text-sm text-muted-foreground">
          Paquetage de départ : {characterClass.startingEquipment.description}
        </p>
      ) : null}
      <ArmorChoice catalog={catalog} draft={draft} onChange={onChange} />
      <ShieldToggle catalog={catalog} draft={draft} onChange={onChange} />
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
function ArmorChoice({ catalog, draft, onChange }: EquipmentStepViewProps) {
  const wearable = wearableArmors(catalog, draft);

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Armure portée</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={draft.armorKey === null ? "default" : "outline"}
          onClick={() => onChange({ armorKey: null })}
        >
          Sans armure
        </Button>
        {wearable.map((armor) => (
          <ArmorButton
            key={armor.key}
            armor={armor}
            selected={draft.armorKey === armor.key}
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

function wearableArmors(catalog: DndCatalog, draft: CharacterDraft): CatalogArmor[] {
  const training = catalog.classes.find((entry) => entry.key === draft.classKey)
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
function ShieldToggle({ catalog, draft, onChange }: EquipmentStepViewProps) {
  const training = catalog.classes.find((entry) => entry.key === draft.classKey)
    ?.armorTraining;
  if (!training?.includes("shields")) return null;

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="shield"
        checked={draft.shield}
        onCheckedChange={(shield) => onChange({ shield })}
      />
      <Label htmlFor="shield">
        Bouclier (+{catalog.shieldArmorClassBonus} CA)
      </Label>
    </div>
  );
}
