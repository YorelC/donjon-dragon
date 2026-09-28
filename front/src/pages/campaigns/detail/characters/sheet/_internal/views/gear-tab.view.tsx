import type { ResolvedEquipment, ResolvedItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Input } from "@/shared/components/atoms/input";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import { COMING_SOON } from "../constants/sheet-labels";
import type { SelectionBinding } from "../types/selection-binding";
import { toGearCategories, toGearTag, type GearCategory } from "../utils/gear-categories";
import { ItemDetailAsideView } from "./item-detail-aside.view";

const GOLD_LABEL = "PO";
const GEAR_HINT =
  "◆ porté, ◇ transporté. Équiper, consommer, ranger, jeter un objet et gérer la bourse arrivent avec l'état d'aventure.";

type ItemSelection = SelectionBinding<ResolvedItem>;

interface GearTabViewProps {
  equipment: ResolvedEquipment;
  selection: ItemSelection;
}

/** Ce que le personnage porte et transporte, en une seule liste ; la fiche de l'objet à droite. */
export function GearTabView({ equipment, selection }: GearTabViewProps) {
  return (
    <div className="sheet-tab-split">
      <div className="flex min-w-0 flex-col gap-6">
        <InventorySection equipment={equipment} selection={selection} />
        <PurseSection gold={equipment.gold} />
        <p className="fine-print">{GEAR_HINT}</p>
      </div>
      <ItemDetailAsideView item={selection.shown} />
    </div>
  );
}

function InventorySection({ equipment, selection }: GearTabViewProps) {
  const categories = toGearCategories(equipment.items);
  if (categories.length === 0) return <p className="empty-state-text">Le sac est vide.</p>;

  return (
    <>
      {categories.map((category) => (
        <GearCategoryView
          key={category.label}
          category={category}
          equipment={equipment}
          selection={selection}
        />
      ))}
    </>
  );
}

interface GearCategoryViewProps extends GearTabViewProps {
  category: GearCategory;
}

function GearCategoryView({ category, equipment, selection }: GearCategoryViewProps) {
  return (
    <section className="flex flex-col gap-[11px]">
      <SectionHeading label={category.label} />
      <ul className="flex flex-col gap-1.5">
        {category.items.map((item) => (
          <GearRow
            key={item.itemKey}
            item={item}
            tag={toGearTag(item, equipment)}
            selection={selection}
          />
        ))}
      </ul>
    </section>
  );
}

interface GearRowProps {
  item: ResolvedItem;
  tag: string | undefined;
  selection: ItemSelection;
}

/** Le survol de la ligne montre la fiche ; le nom est le bouton qui l'épingle. */
function GearRow({ item, tag, selection }: GearRowProps) {
  const pinned = selection.pinned === item;

  return (
    <li
      data-worn={item.worn}
      onMouseEnter={() => selection.onEnter(item)}
      onMouseLeave={selection.onLeave}
      className={cn(
        "sheet-row grid grid-cols-[10px_minmax(0,1fr)_38px_auto] items-center gap-2 border-gold/10 py-[9px] transition-colors hover:border-gold/40",
        pinned && "border-gold/70 bg-gold/[.06]",
      )}
    >
      <Diamond size="tick" tone={item.worn ? "filled" : "active"} />
      <ItemName item={item} tag={tag} selection={selection} />
      <span className="text-right font-display text-sm text-gold-value tabular-nums">
        {item.quantity}
      </span>
      <span className="flex items-center justify-end gap-1">
        <ItemAction label={`Utiliser : ${item.name}`} glyph="−1" />
        <ItemAction label={`Ranger : ${item.name}`} glyph="⇄" />
        <ItemAction label={`Jeter : ${item.name}`} glyph="✕" />
      </span>
    </li>
  );
}

function ItemName({ item, tag, selection }: GearRowProps) {
  return (
    <button
      type="button"
      aria-pressed={selection.pinned === item}
      onClick={() => selection.onSelect(item)}
      onFocus={() => selection.onEnter(item)}
      onBlur={selection.onLeave}
      className="flex min-w-0 cursor-pointer flex-col items-start gap-0.5 text-left"
    >
      <span className="w-full truncate text-body/[1.3] text-gold-selected">{item.name}</span>
      {tag ? <span className="sheet-tag">{tag}</span> : null}
    </button>
  );
}

function ItemAction({ label, glyph }: { label: string; glyph: string }) {
  return (
    <Button variant="outline" size="icon-xs" disabled aria-label={label} title={COMING_SOON}>
      {glyph}
    </Button>
  );
}

function PurseSection({ gold }: { gold: number }) {
  return (
    <section className="flex flex-col gap-[11px] border-t border-gold/16 pt-4">
      <SectionHeading label="Bourse" />
      <div className="panel-inset flex w-20 flex-col items-center gap-1 px-1.5 py-2.5">
        <span className="font-display text-[10px] tracking-label text-gold/72">{GOLD_LABEL}</span>
        <span className="font-display text-base text-gold-title">{gold}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
        <Input type="number" disabled placeholder="Montant" aria-label="Montant" />
        <Button variant="outline" size="sm" disabled title={COMING_SOON}>Dépenser</Button>
        <Button variant="outline" size="sm" disabled title={COMING_SOON}>Recevoir</Button>
      </div>
    </section>
  );
}
