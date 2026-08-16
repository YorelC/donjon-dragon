import type { CatalogEquipmentOption, Item } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Label } from "@/shared/components/atoms/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/atoms/radio-group";

interface EquipmentOptionGroupProps {
  title: string;
  options: CatalogEquipmentOption[];
  selectedId: string | null;
  selection: { items: Item[]; onSelect: (optionId: string) => void };
}

/**
 * Un choix de paquetage : les options du manuel, dont la dernière est toujours
 * « tout en or ». C'est le seul choix que le joueur fait ici — l'inventaire en
 * découle.
 */
export function EquipmentOptionGroupView({
  title,
  options,
  selectedId,
  selection,
}: EquipmentOptionGroupProps) {
  if (options.length === 0) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">{title}</h3>
      <RadioGroup value={selectedId ?? ""} onValueChange={selection.onSelect} className="grid gap-2">
        {options.map((option) => (
          <EquipmentOptionCard
            key={option.id}
            option={option}
            items={selection.items}
            selected={option.id === selectedId}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

interface EquipmentOptionCardProps {
  option: CatalogEquipmentOption;
  items: Item[];
  selected: boolean;
}

function EquipmentOptionCard({ option, items, selected }: EquipmentOptionCardProps) {
  const inputId = `equipment-option-${option.id}`;

  return (
    <div
      className={`grid gap-2 rounded-lg border p-3 ${
        selected ? "border-primary bg-accent/40" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem value={option.id} id={inputId} className="mt-1" />
        <Label htmlFor={inputId} className="grid gap-1 font-normal">
          <span className="font-medium">Option {option.id}</span>
          <span className="text-sm text-muted-foreground">{option.label}</span>
        </Label>
      </div>
      <GrantedItemList entries={option.entries} items={items} gold={option.gold} />
    </div>
  );
}

interface GrantedItemListProps {
  entries: CatalogEquipmentOption["entries"];
  items: Item[];
  gold: number;
}

/**
 * Ce que l'option dépose vraiment dans l'inventaire. Ce n'est pas toujours le
 * libellé mot pour mot : quand le manuel dit « outils d'artisan », il désigne
 * une catégorie que l'étape des maîtrises tranchera, pas un objet à recevoir.
 */
function GrantedItemList({ entries, items, gold }: GrantedItemListProps) {
  if (entries.length === 0) return <GoldBadge gold={gold} />;

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((entry) => (
        <Badge key={entry.itemKey} variant="secondary">
          {nameOf(entry.itemKey, items)}
          {entry.quantity > 1 ? ` ×${entry.quantity}` : ""}
        </Badge>
      ))}
      <GoldBadge gold={gold} />
    </div>
  );
}

function GoldBadge({ gold }: { gold: number }) {
  if (gold === 0) return null;

  return <Badge variant="outline">{gold} po</Badge>;
}

/** La clé nue si le catalogue n'est pas encore là : jamais une ligne vide. */
function nameOf(itemKey: string, items: Item[]): string {
  return items.find((item) => item.key === itemKey)?.name ?? itemKey;
}
