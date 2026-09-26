import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { OptionListView, type OptionList } from "./option-list.view";

export interface SingleChoice extends OptionList {
  title: string;
}

/**
 * L'écran d'un choix unique parmi une liste décrite : lignage, Style de combat,
 * Ordre divin, Ordre primitif, alignement. Leur description se lit dans la
 * fiche détaillée, au survol.
 */
export function ChoiceStepView({ choice }: { choice: SingleChoice }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionHeading label={choice.title} />
      <OptionListView list={choice} />
    </div>
  );
}
