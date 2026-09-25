import type { ResolvedEquipment, ResolvedItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Input } from "@/shared/components/atoms/input";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { COMING_SOON } from "../constants/sheet-labels";

const GOLD_LABEL = "PO";
const GEAR_HINT =
  "Consommer, ranger, jeter un objet et gérer la bourse arrivent avec l'état d'aventure.";

/** Ce que le personnage porte et transporte. Les actions sont annoncées, pas encore ouvertes. */
export function GearTabView({ equipment }: { equipment: ResolvedEquipment }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <WornSection equipment={equipment} />
      <InventorySection items={equipment.items} />
      <PurseSection gold={equipment.gold} />
      <p className="fine-print">{GEAR_HINT}</p>
    </div>
  );
}

function WornSection({ equipment }: { equipment: ResolvedEquipment }) {
  const { armorName, shield, stealthDisadvantage } = equipment;
  const stealthTag = stealthDisadvantage ? "Discrétion désavantagée" : "Armure";

  return (
    <section className="flex flex-col gap-[11px]">
      <SectionHeading label="Équipement" />
      <ul className="flex flex-col gap-1.5">
        {armorName ? <WornRow name={armorName} tag={stealthTag} /> : null}
        {shield ? <WornRow name="Bouclier" tag="Bouclier" /> : null}
      </ul>
      {!armorName && !shield ? <p className="empty-state-text">Aucune armure portée.</p> : null}
    </section>
  );
}

function WornRow({ name, tag }: { name: string; tag: string }) {
  return (
    <li className="sheet-row grid grid-cols-[10px_minmax(0,1fr)] items-center gap-2 py-[9px]">
      <Diamond size="tick" tone="filled" />
      <ItemName name={name} tag={tag} />
    </li>
  );
}

function InventorySection({ items }: { items: ResolvedItem[] }) {
  return (
    <section className="flex flex-col gap-[11px]">
      <SectionHeading label="Inventaire" />
      {items.length === 0 ? <p className="empty-state-text">Le sac est vide.</p> : null}
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <InventoryRow key={item.itemKey} item={item} />
        ))}
      </ul>
    </section>
  );
}

function InventoryRow({ item }: { item: ResolvedItem }) {
  return (
    <li className="sheet-row grid grid-cols-[10px_minmax(0,1fr)_38px_auto] items-center gap-2 border-gold/10 py-[9px]">
      <Diamond size="tick" tone="active" />
      <ItemName name={item.name} />
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
