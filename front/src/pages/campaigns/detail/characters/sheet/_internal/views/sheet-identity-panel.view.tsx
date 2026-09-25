import { Diamond } from "@/shared/components/molecules/diamond";
import { DiamondRule } from "@/shared/components/molecules/gold-rule";
import { toInitials } from "@/shared/utils/display-meta";
import { SIZE_LABELS } from "../constants/sheet-labels";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { formatMeters, formatSigned, toLabelList } from "../utils/sheet-format";
import { SheetAbilitiesView } from "./sheet-abilities.view";
import { SheetPhysicalView, SheetSkillsView } from "./sheet-skills.view";

interface SheetIdentityPanelViewProps {
  model: CharacterSheetModel;
}

/** La colonne d'identité : qui est le personnage, et ce qu'il vaut en un coup d'œil. */
export function SheetIdentityPanelView({ model }: SheetIdentityPanelViewProps) {
  return (
    <section className="panel flex flex-col gap-[18px] px-5 py-[22px]">
      <SheetCrest model={model} />
      <SheetAbilitiesView sheet={model.sheet} />
      <SheetChips model={model} />
      <SheetVitals model={model} />
      <SheetPhysicalView identity={model.identity} />
      <SheetSkillsView sheet={model.sheet} labels={model.labels.skills} />
    </section>
  );
}

function SheetCrest({ model }: SheetIdentityPanelViewProps) {
  const { sheet, identity, labels } = model;

  return (
    <header className="flex flex-col items-center gap-2.5">
      <Diamond size="crest" tone="active">{toInitials(identity.name)}</Diamond>
      <div className="flex w-full flex-col items-center gap-0.5 text-center">
        <h2 className="font-display text-xl tracking-meta text-gold-selected">{identity.name}</h2>
        <div className="my-1.5 w-full"><DiamondRule /></div>
        <span className="font-display text-[15px] tracking-display text-gold-value">
          {sheet.className}
        </span>
        <span className="text-sm tracking-title text-ink-meta">{toOrigin(model)}</span>
        <span className="mt-[3px] text-label tracking-section text-gold/80 uppercase">
          {labels.alignment}
        </span>
        <BackgroundLine name={sheet.backgroundName} />
      </div>
    </header>
  );
}

function BackgroundLine({ name }: { name: string }) {
  return (
    <span className="mt-[7px] flex items-baseline gap-1.5 border-t border-gold/16 pt-[7px]">
      <span className="font-display text-meta tracking-section text-gold/60 uppercase">
        Historique
      </span>
      <span className="text-sm tracking-meta text-foreground">{name}</span>
    </span>
  );
}

function SheetChips({ model }: SheetIdentityPanelViewProps) {
  const { sheet } = model;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <SheetChip label="PV" value={String(sheet.maxHitPoints.value)} />
      <SheetChip label="Maîtrise" value={formatSigned(sheet.proficiencyBonus)} />
      <SheetChip label="CA" value={String(sheet.armorClass.value)} />
    </div>
  );
}

function SheetChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="sheet-chip">
      <span className="sheet-caption">{label}</span>
      <span className="font-display text-base text-gold-title">{value}</span>
    </div>
  );
}

function SheetVitals({ model }: SheetIdentityPanelViewProps) {
  const { sheet, labels } = model;

  return (
    <div className="flex justify-between gap-2 border-t border-gold/16 pt-3.5">
      <SheetVital label="Vitesse" value={formatMeters(sheet.speed.value)} />
      <SheetVital label="Catégorie" value={SIZE_LABELS[sheet.size]} />
      <SheetVital label="Initiative" value={formatSigned(sheet.initiative.value)} />
      <SheetVital
        label="Langues"
        value={toLabelList(labels.languages, sheet.proficiencies.languages)}
      />
    </div>
  );
}

function SheetVital({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[3px] text-center">
      <span className="sheet-caption">{label}</span>
      <span className="font-display text-sm text-gold-value">{value}</span>
    </div>
  );
}

function toOrigin({ sheet }: CharacterSheetModel): string {
  const species = sheet.lineageName
    ? `${sheet.speciesName} (${sheet.lineageName})`
    : sheet.speciesName;
  return `${species} · niveau ${sheet.level}`;
}
