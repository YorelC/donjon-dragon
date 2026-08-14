import type { Ability, BackgroundKey, CatalogBackground, DndCatalog } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Separator } from "@/shared/components/atoms/separator";
import { ABILITY_LABELS, type WizardDraft } from "../types/wizard-draft";
import { OptionListView } from "./option-list.view";

/** Les deux répartitions du PHB 2024. */
const BONUS_PLANS = [
  { key: "focused", label: "+2 et +1" },
  { key: "spread", label: "+1 partout" },
] as const;

type PlanKey = (typeof BONUS_PLANS)[number]["key"];

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
      {feat ? <p className="text-sm text-muted-foreground">{feat.description}</p> : null}
      <BonusChoice {...props} />
    </div>
  );
}

/**
 * Le joueur choisit QUELLE caractéristique reçoit quoi. Attribuer +2 à la
 * première des trois et +1 à la deuxième, comme le faisait la version
 * précédente, ne vient d'aucune règle.
 */
function BonusChoice({ background, draft, onChange }: BackgroundDetailsProps) {
  const plan = currentPlan(draft);

  return (
    <div className="grid gap-3">
      <h3 className="section-title text-sm">Bonus de caractéristique</h3>
      <div className="flex flex-wrap gap-2">
        {BONUS_PLANS.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={plan === option.key ? "default" : "outline"}
            onClick={() => onChange({ backgroundBonuses: initialBonuses(background, option.key) })}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {plan === "focused" ? (
        <FocusedPicker background={background} draft={draft} onChange={onChange} />
      ) : null}
    </div>
  );
}

type BonusPickerProps = Omit<BackgroundDetailsProps, "catalog">;

/** En +2/+1, seules deux des trois caractéristiques reçoivent quelque chose. */
function FocusedPicker({ background, draft, onChange }: BonusPickerProps) {
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">
        Choisissez la caractéristique qui reçoit +2, puis celle qui reçoit +1.
      </p>
      <div className="flex flex-wrap gap-2">
        {background.abilityBonuses.map((ability) => (
          <AbilityBonusButton
            key={ability}
            ability={ability as Ability}
            draft={draft}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

interface AbilityBonusButtonProps {
  ability: Ability;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

function AbilityBonusButton({ ability, draft, onChange }: AbilityBonusButtonProps) {
  const bonus = draft.backgroundBonuses[ability] ?? 0;

  return (
    <Button
      type="button"
      size="sm"
      variant={bonus > 0 ? "default" : "outline"}
      onClick={() => onChange({ backgroundBonuses: cycle(draft, ability) })}
    >
      {ABILITY_LABELS[ability]}
      {bonus > 0 ? ` +${bonus}` : ""}
    </Button>
  );
}

function currentPlan(draft: WizardDraft): PlanKey | null {
  const bonuses = Object.values(draft.backgroundBonuses).filter(Boolean);
  if (bonuses.length === 3) return "spread";
  if (bonuses.includes(2)) return "focused";

  return null;
}

function initialBonuses(background: CatalogBackground, plan: PlanKey) {
  if (plan === "spread") {
    return Object.fromEntries(background.abilityBonuses.map((ability) => [ability, 1]));
  }

  return {};
}

/**
 * Un clic fait tourner la caractéristique entre rien, +2 et +1. Le +2 et le +1
 * sont uniques : les donner à une autre caractéristique les retire de celle qui
 * les portait.
 */
function cycle(draft: WizardDraft, ability: Ability) {
  const current = draft.backgroundBonuses[ability] ?? 0;
  const next = current === 0 ? 2 : current === 2 ? 1 : 0;
  const cleared = Object.fromEntries(
    Object.entries(draft.backgroundBonuses).filter(
      ([key, bonus]) => key !== ability && bonus !== next,
    ),
  );

  return next === 0 ? cleared : { ...cleared, [ability]: next };
}
