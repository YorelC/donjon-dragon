import { OptionListView, type SelectableOption } from "./option-list.view";

interface ChoiceStepViewProps {
  title: string;
  description: string;
  options: readonly SelectableOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * L'écran d'un choix unique parmi une liste décrite : lignage, Style de combat,
 * Ordre divin, Ordre primitif. Ils ne diffèrent que par leur titre et leur
 * source ; leur donner un écran chacun n'apporterait rien.
 */
export function ChoiceStepView(props: ChoiceStepViewProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h3 className="section-title text-base">{props.title}</h3>
        <p className="text-sm text-muted-foreground">{props.description}</p>
      </div>
      <OptionListView
        options={props.options}
        selectedKey={props.selectedKey}
        onSelect={props.onSelect}
      />
    </div>
  );
}
