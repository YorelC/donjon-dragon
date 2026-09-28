import type { ResolvedEquipment, ResolvedItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Input } from "@/shared/components/atoms/input";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { COMING_SOON } from "../constants/sheet-labels";
import { toGearCategories, toGearTag, type GearCategory } from "../utils/gear-categories";

const GOLD_LABEL = "PO";
const GEAR_HINT =
  "◆ porté, ◇ transporté. Équiper, consommer, ranger, jeter un objet et gérer la bourse arrivent avec l'état d'aventure.";

/** Ce que le personnage porte et transporte, en une seule liste : un objet, une ligne. */
export function GearTabView({ equipment }: { equipment: ResolvedEquipment }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <InventorySection equipment={equipment} />
      <PurseSection gold={equipment.gold} />
      <p className="fine-print">{GEAR_HINT}</p>
    </div>
  );
}

function InventorySection({ equipment }: { equipment: ResolvedEquipment }) {
  const categories = toGearCategories(equipment.items);
  if (categories.length === 0) return <p className="empty-state-text">Le sac est vide.</p>;

  return (
    <>
      {categories.map((category) => (
        <GearCategoryView key={category.label} category={category} equipment={equipment} />
      ))}
    </>
  );
}

interface GearCategoryViewProps {
  category: GearCategory;
  equipment: ResolvedEquipment;
}

function GearCategoryView({ category, equipment }: GearCategoryViewProps) {
  return (
    <section className="flex flex-col gap-[11px]">
      <SectionHeading label={category.label} />
      <ul className="flex flex-col gap-1.5">
        {category.items.map((item) => (
          <GearRow key={item.itemKey} item={item} tag={toGearTag(item, equipment)} />
        ))}
      </ul>
    </section>
  );
}

function GearRow({ item, tag }: { item: ResolvedItem; tag: string | undefined }) {
  return (
    <li
      data-worn={item.worn}
      className="sheet-row grid grid-cols-[10px_minmax(0,1fr)_38px_auto] items-center gap-2 border-gold/10 py-[9px]"
    >
      <Diamond size="tick" tone={item.worn ? "filled" : "active"} />
      <ItemName name={item.name} tag={tag} />
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

function ItemName({ name, tag }: { name: string; tag?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-body/[1.3] text-gold-selected">{name}</span>
      {tag ? <span className="sheet-tag">{tag}</span> : null}
    </div>
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
