import { ChoiceTile } from "@/shared/components/molecules/choice-tile";
import { cn } from "@/shared/utils/utils";
import { distinctAbbreviationsOf } from "../types/builder-step-texts";

export interface SelectableOption {
  key: string;
  name: string;
}

/** `initials` : un losange à deux lettres ; `plain` : le libellé seul, sur trois colonnes. */
const LOOK_GRIDS = {
  initials: "grid-cols-2",
  plain: "grid-cols-2 sm:grid-cols-3",
} as const;

export interface OptionList {
  options: readonly SelectableOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Montre l'option dans la fiche détaillée, au survol ou au focus. */
  onPreview?: (key: string) => void;
  look?: keyof typeof LOOK_GRIDS;
}

/**
 * La liste de choix unique du builder : espèce, classe, historique, lignage,
 * style, ordre, alignement.
 *
 * Une vignette déjà retenue ne rejoue pas son choix. Chaque appelant remet à zéro
 * ce que son choix périme — l'espèce efface don et gabarit, la classe efface
 * sorts et compétences — donc un simple re-clic, ou une touche Entrée sur la
 * vignette active, effaçait tout sans rien changer par ailleurs.
 */
export function OptionListView({ list }: { list: OptionList }) {
  const abbreviations = distinctAbbreviationsOf(list.options.map((option) => option.name));

  return (
    <div role="radiogroup" className={cn("grid gap-2.5", LOOK_GRIDS[list.look ?? "initials"])}>
      {list.options.map((option, rank) => (
        <OptionTile
          key={option.key}
          option={{ ...option, abbr: list.look === "plain" ? undefined : abbreviations[rank] }}
          list={list}
        />
      ))}
    </div>
  );
}

interface OptionTileProps {
  option: SelectableOption & { abbr?: string };
  list: OptionList;
}

function OptionTile({ option, list }: OptionTileProps) {
  const selected = option.key === list.selectedKey;

  return (
    <ChoiceTile
      option={{ abbr: option.abbr, label: option.name }}
      state={selected ? "selected" : "idle"}
      actions={{
        select: () => (selected ? undefined : list.onSelect(option.key)),
        preview: () => list.onPreview?.(option.key),
      }}
    />
  );
}
