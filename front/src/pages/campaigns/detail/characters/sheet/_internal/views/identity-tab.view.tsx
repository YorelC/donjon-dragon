import type { ReactNode } from "react";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import {
  toPhysicalRows,
  toProficiencyRows,
  toSenseRows,
  type ProficiencyRow,
} from "../utils/proficiency-rows";

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
      <IdentitySection label="Signalement">
        <RowGrid rows={toPhysicalRows(identity)} />
      </IdentitySection>
      <IdentitySection label="Maîtrises et langues">
        <RowGrid rows={toProficiencyRows(sheet, labels)} />
      </IdentitySection>
      <IdentitySection label="Sens">
        <RowGrid rows={toSenseRows(sheet)} />
      </IdentitySection>
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
