import type {
  Ability,
  BackgroundKey,
  CatalogBackground,
  DndCatalog,
} from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Separator } from "@/shared/components/atoms/separator";
import { ABILITY_LABELS } from "../types/wizard-draft";
import type { WizardDraft } from "../types/wizard-draft";
import { OptionListView } from "./option-list.view";

/** Les deux répartitions du PHB 2024 : +2/+1, ou +1 sur chacune des trois. */
const BONUS_PLANS = [
  { key: "focused", label: "+2 / +1" },
  { key: "spread", label: "+1 / +1 / +1" },
] as const;

interface BackgroundStepViewProps {
  catalog: DndCatalog;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

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

function BackgroundDetails(props: BackgroundDetailsProps) {
  const { catalog, background } = props;
  const feat = catalog.originFeats.find((entry) => entry.key === background.originFeat);

  return (
    <div className="grid gap-4">
      <Separator />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          Compétences : {background.skillProficiencies.join(", ")}
        </Badge>
        <Badge variant="outline">Outil : {background.toolProficiency}</Badge>
        {feat ? <Badge>Don : {feat.name}</Badge> : null}
      </div>
      <BonusPlanChoice {...props} />
    </div>
  );
}

function BonusPlanChoice({ background, draft, onChange }: BackgroundDetailsProps) {
  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Bonus de caractéristique</h3>
      <div className="flex flex-wrap gap-2">
        {BONUS_PLANS.map((plan) => (
          <Button
            key={plan.key}
            type="button"
            size="sm"
            variant={matchesPlan(draft, plan.key) ? "default" : "outline"}
            onClick={() =>
              onChange({ backgroundBonuses: applyPlan(background.abilityBonuses, plan.key) })
            }
          >
            {plan.label}
          </Button>
        ))}
      </div>
      <BonusDetail background={background} draft={draft} />
    </div>
  );
}

function BonusDetail({
  background,
  draft,
}: Pick<BackgroundDetailsProps, "background" | "draft">) {
  return (
    <p className="text-sm text-muted-foreground">
      {background.abilityBonuses
        .map((ability) => {
          const bonus = draft.backgroundBonuses[ability as Ability] ?? 0;
          return `${ABILITY_LABELS[ability as Ability]} +${bonus}`;
        })
        .join(" · ")}
    </p>
  );
}

type PlanKey = (typeof BONUS_PLANS)[number]["key"];

function applyPlan(abilities: readonly string[], plan: PlanKey) {
  const values = plan === "focused" ? [2, 1, 0] : [1, 1, 1];

  return Object.fromEntries(
    abilities
      .map((ability, index) => [ability, values[index] ?? 0])
      .filter(([, bonus]) => bonus !== 0),
  );
}

function matchesPlan(draft: WizardDraft, plan: PlanKey): boolean {
  const bonuses = Object.values(draft.backgroundBonuses).filter(Boolean);
  if (plan === "focused") return bonuses.length === 2 && bonuses.includes(2);

  return bonuses.length === 3;
}
