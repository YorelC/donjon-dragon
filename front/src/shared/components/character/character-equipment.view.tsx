import type { ComputedCharacter, ResolvedItem } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";

interface CharacterEquipmentViewProps {
  sheet: ComputedCharacter;
}

/**
 * Ce que le personnage porte et ce qu'il transporte. Tout arrive déjà nommé du
 * serveur — la fiche ne connaît aucune clé d'objet.
 */
export function CharacterEquipmentView({ sheet }: CharacterEquipmentViewProps) {
  return (
    <div className="grid gap-4">
      <h3 className="section-title text-sm">Équipement</h3>
      <WornBlock sheet={sheet} />
      <InventoryBlock sheet={sheet} />
    </div>
  );
}

function WornBlock({ sheet }: CharacterEquipmentViewProps) {
  const { armorName, shield, gold, stealthDisadvantage } = sheet.equipment;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">{armorName ?? "Sans armure"}</Badge>
      {shield ? <Badge variant="outline">Bouclier</Badge> : null}
      {stealthDisadvantage ? (
        <Badge variant="destructive">Discrétion désavantagée</Badge>
      ) : null}
      <Badge>{gold} po</Badge>
    </div>
  );
}

function InventoryBlock({ sheet }: CharacterEquipmentViewProps) {
  if (sheet.equipment.items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun objet transporté.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sheet.equipment.items.map((item) => (
        <InventoryRow key={item.itemKey} item={item} />
      ))}
    </div>
  );
}

function InventoryRow({ item }: { item: ResolvedItem }) {
  return (
    <Badge variant="secondary">
      {item.name}
      {item.quantity > 1 ? ` ×${item.quantity}` : ""}
    </Badge>
  );
}
