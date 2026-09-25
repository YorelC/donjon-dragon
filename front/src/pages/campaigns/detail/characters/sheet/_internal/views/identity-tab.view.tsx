import type { ReactNode } from "react";
import type { ComputedCharacter } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { toProficiencyRows, toSenseRows, type ProficiencyRow } from "../utils/proficiency-rows";
import { SlotPips } from "./spell-group.view";

/**
 * Qui est le personnage. Traits de personnalité, idéal, lien, défaut et histoire
 * n'existent pas encore côté API : leurs blocs ne s'affichent pas.
 */
export function IdentityTabView({ model }: { model: CharacterSheetModel }) {
  const { sheet, identity, labels } = model;

  return (
    <div className="flex flex-col gap-6">
      {identity.description ? (
        <IdentitySection label="Apparence">
          <p className="max-w-[760px] text-body/[1.75] text-ink-prose text-pretty">
            {identity.description}
          </p>
        </IdentitySection>
      ) : null}
      <IdentitySection label="Maîtrises et langues">
        <RowGrid rows={toProficiencyRows(sheet, labels)} />
      </IdentitySection>
      <IdentitySection label="Sens">
        <RowGrid rows={toSenseRows(sheet)} />
      </IdentitySection>
      <SpellSlots sheet={sheet} />
      <BackgroundSection name={sheet.backgroundName} description={labels.backgroundDescription} />
    </div>
  );
}

function IdentitySection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[11px]">
      <SectionHeading label={label} />
      {children}
    </section>
  );
}

function RowGrid({ rows }: { rows: ProficiencyRow[] }) {
  return (
    <dl className="grid gap-x-[30px] gap-y-[9px] md:grid-cols-2">
      {rows.map((row) => (
        <IdentityRow key={row.name} row={row} />
      ))}
    </dl>
  );
}

function IdentityRow({ row }: { row: ProficiencyRow }) {
  return (
    <div className="grid grid-cols-[128px_minmax(0,1fr)] items-baseline gap-3">
      <dt className="text-sm text-ink-meta">{row.name}</dt>
      <dd className="text-body/[1.55] text-foreground">{row.value}</dd>
    </div>
  );
}

function SpellSlots({ sheet }: { sheet: ComputedCharacter }) {
  const casters = sheet.spellcasting.filter((entry) => entry.level1Slots > 0);
  if (casters.length === 0) return null;

  return (
    <IdentitySection label="Emplacements de sorts">
      <div className="flex flex-wrap gap-5">
        {casters.map((entry) => (
          <SlotLine key={entry.origin} origin={entry.origin} slots={entry.level1Slots} />
        ))}
      </div>
    </IdentitySection>
  );
}

function SlotLine({ origin, slots }: { origin: string; slots: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-overline tracking-title whitespace-nowrap text-ink-meta uppercase">
        {origin} · niveau 1
      </span>
      <SlotPips count={slots} />
    </div>
  );
}

interface BackgroundSectionProps {
  name: string;
  description: string | null;
}

function BackgroundSection({ name, description }: BackgroundSectionProps) {
  if (!description) return null;

  return (
    <IdentitySection label={`Historique · ${name}`}>
      <p className="max-w-[760px] text-body/[1.75] text-ink-value text-pretty">{description}</p>
    </IdentitySection>
  );
}
