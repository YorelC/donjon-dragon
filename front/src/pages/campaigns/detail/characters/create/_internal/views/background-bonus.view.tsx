import type { Ability, CatalogBackground } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { ABILITY_LABELS, type WizardDraft } from "../types/wizard-draft";

/** Les deux répartitions du PHB 2024. */
const PLANS = [
  { key: "focused", label: "+2 et +1" },
  { key: "spread", label: "+1 partout" },
] as const;

type PlanKey = (typeof PLANS)[number]["key"];

interface BackgroundBonusViewProps {
  background: CatalogBackground;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

/**
 * Les bonus de l'historique, posés à la fin de l'étape des caractéristiques.
 *
 * Le joueur choisit QUELLE caractéristique reçoit quoi, parmi les trois de son
 * historique. La version précédente les attribuait dans l'ordre du catalogue,
 * ce qui ne vient d'aucune règle — et son sélecteur ne s'affichait jamais.
 */
export function BackgroundBonusView(props: BackgroundBonusViewProps) {
  const plan = currentPlan(props.draft);

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <h3 className="section-title text-sm">
          Bonus de {props.background.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {plan === "spread"
            ? "Chacune des trois caractéristiques reçoit +1."
            : "Choisissez la caractéristique qui reçoit +2, puis celle qui reçoit +1."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PLANS.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="sm"
            variant={plan === option.key ? "default" : "outline"}
            onClick={() => props.onChange({ backgroundBonuses: startPlan(props, option.key) })}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {plan === "focused" ? <FocusedPicker {...props} /> : null}
    </div>
  );
}

function FocusedPicker({ background, draft, onChange }: BackgroundBonusViewProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {background.abilityBonuses.map((ability) => (
        <BonusButton
          key={ability}
          ability={ability as Ability}
          draft={draft}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

interface BonusButtonProps {
  ability: Ability;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

function BonusButton({ ability, draft, onChange }: BonusButtonProps) {
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
  if (bonuses.length === 3 && bonuses.every((bonus) => bonus === 1)) return "spread";
  if (bonuses.includes(2)) return "focused";

  return null;
}

/**
 * Passer en « +1 partout » ne laisse rien à choisir. Passer en « +2 et +1 » vide
 * la sélection pour que le joueur la refasse — c'est là que la version
 * précédente se bloquait : elle vidait aussi, mais son `currentPlan` lisait un
 * objet vide comme « aucun plan » et n'affichait plus le sélecteur.
 */
function startPlan({ background }: BackgroundBonusViewProps, plan: PlanKey) {
  if (plan === "spread") {
    return Object.fromEntries(background.abilityBonuses.map((ability) => [ability, 1]));
  }

  return { [background.abilityBonuses[0] as Ability]: 2 };
}

/** Un clic fait tourner : rien, +2, +1. Le +2 comme le +1 restent uniques. */
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
