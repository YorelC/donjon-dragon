import type { ComputedCharacter } from "@donjon-dragon/shared";
import { Diamond } from "@/shared/components/molecules/diamond";
import { BackLink, type PageBack } from "@/shared/components/molecules/page-header";
import { SIZE_LABELS } from "@/shared/constants/character-labels";
import { toInitials } from "@/shared/utils/display-meta";
import type { CharacterSheetModel } from "../types/character-sheet-model";

interface SheetIdentityViewProps {
  model: CharacterSheetModel;
  back: PageBack;
}

/**
 * Qui est le personnage. Le retour se range au-dessus du nom, à côté du blason : la
 * hauteur du bandeau est celle du blason, et chaque ligne gagnée va au bloc des jets.
 */
export function SheetIdentityView({ model, back }: SheetIdentityViewProps) {
  const { sheet, identity, labels } = model;

  return (
    <div className="flex min-w-0 items-center gap-5 pl-2">
      <Diamond size="crest" tone="active">{toInitials(identity.name)}</Diamond>
      <div className="flex min-w-0 flex-col gap-0.5">
        <BackLink back={back} />
        <h1 className="font-display text-[24px]/[1.15] tracking-meta text-gold-selected">
          {identity.name}
        </h1>
        <ClassLine sheet={sheet} />
        <OriginLine sheet={sheet} alignment={labels.alignment} />
      </div>
    </div>
  );
}

/** L'historique rejoint la classe : la ligne d'origine tient ainsi sur une ligne. */
function ClassLine({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="font-display text-[15px] tracking-display text-gold-value">
        {sheet.className}
      </span>
      <Diamond size="tick" tone="filled" />
      <span className="text-sm tracking-meta text-foreground">{sheet.backgroundName}</span>
    </span>
  );
}

function OriginLine({ sheet, alignment }: { sheet: ComputedCharacter; alignment: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm tracking-meta text-ink-meta">
      <span>{toOrigin(sheet)}</span>
      <Diamond size="tick" tone="filled" />
      <span className="text-label tracking-section text-gold/80 uppercase">{alignment}</span>
    </span>
  );
}

function toOrigin(sheet: ComputedCharacter): string {
  const species = sheet.lineageName ? sheet.lineageName : sheet.speciesName;
  return `${species} · niveau ${sheet.level} · taille ${SIZE_LABELS[sheet.size]}`;
}
