import type { BackgroundKey, CatalogBackground, DndCatalog } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Separator } from "@/shared/components/atoms/separator";
import { ABILITY_LABELS, type WizardDraft } from "../types/wizard-draft";
import { OptionListView } from "./option-list.view";

interface BackgroundStepViewProps {
  catalog: DndCatalog;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

/**
 * Le choix de l'historique seul. Ses bonus de caractéristique se posent à
 * l'étape des Caractéristiques, là où l'on voit leur effet sur les scores.
 */
export function BackgroundStepView(props: BackgroundStepViewProps) {
  const { catalog, draft, onChange } = props;
  const background = catalog.backgrounds.find((entry) => entry.key === draft.backgroundKey);

  return (
    <div className="grid gap-4">
      <OptionListView
        options={catalog.backgrounds}
        selectedKey={draft.backgroundKey}
        onSelect={(key) =>
          onChange({ backgroundKey: key as BackgroundKey, backgroundBonuses: {} })
        }
      />
      {background ? <BackgroundDetails {...props} background={background} /> : null}
    </div>
  );
}

interface BackgroundDetailsProps extends BackgroundStepViewProps {
  background: CatalogBackground;
}

function BackgroundDetails({ catalog, background }: BackgroundDetailsProps) {
  const feat = catalog.originFeats.find((entry) => entry.key === background.originFeat);

  return (
    <div className="grid gap-3">
      <Separator />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          Compétences : {background.skillProficiencies.join(", ")}
        </Badge>
        <Badge variant="outline">Outil : {background.toolProficiency}</Badge>
        {feat ? <Badge>Don : {feat.name}</Badge> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Bonus à répartir plus tard :{" "}
        {background.abilityBonuses
          .map((ability) => ABILITY_LABELS[ability as keyof typeof ABILITY_LABELS])
          .join(", ")}
      </p>
      {feat ? <p className="text-sm text-muted-foreground">{feat.description}</p> : null}
    </div>
  );
}
