import type { Ability, CatalogBackground } from "@donjon-dragon/shared";
import { Checkbox } from "@/shared/components/atoms/checkbox";
import { Label } from "@/shared/components/atoms/label";
import { ABILITIES, ABILITY_LABELS, type CharacterDraft } from "../types/character-draft";
import { AbilityValueControlView, type ValueControl } from "./ability-value-control.view";

export type BonusPlan = "focused" | "spread";

export interface AbilityGrid {
  control: ValueControl;
  background: CatalogBackground | null;
  plan: BonusPlan;
}

interface AbilityGridViewProps {
  grid: AbilityGrid;
}

/**
 * Une ligne par caractéristique : son nom, sa valeur, et les deux cases de bonus.
 *
 * Les bonus viennent de l'historique et ne peuvent aller que sur ses trois
 * caractéristiques — c'est la règle 2024, qui les a déplacés de l'espèce vers
 * l'antécédent. Les autres lignes restent affichées mais grisées, pour qu'on
 * voie tout de suite pourquoi elles ne s'offrent pas.
 */
export function AbilityGridView({ grid }: AbilityGridViewProps) {
  return (
    <div className="grid gap-2">
      <GridHeader grid={grid} />
      {ABILITIES.map((ability) => (
        <AbilityRow key={ability} ability={ability} grid={grid} />
      ))}
    </div>
  );
}

const ROW_COLUMNS = "grid grid-cols-[8rem_1fr_3rem_3rem] items-center gap-3";

function GridHeader({ grid }: AbilityGridViewProps) {
  return (
    <div className={`${ROW_COLUMNS} text-xs uppercase text-muted-foreground`}>
      <span />
      <span>Valeur</span>
      <span className="text-center">{grid.plan === "spread" ? "+1" : "+2"}</span>
      <span className="text-center">{grid.plan === "spread" ? "" : "+1"}</span>
    </div>
  );
}

interface AbilityRowProps extends AbilityGridViewProps {
  ability: Ability;
}

function AbilityRow({ ability, grid }: AbilityRowProps) {
  return (
    <div className={ROW_COLUMNS}>
      <Label>{ABILITY_LABELS[ability]}</Label>
      <AbilityValueControlView ability={ability} control={grid.control} />
      <BonusCell ability={ability} grid={grid} bonus={2} />
      <BonusCell ability={ability} grid={grid} bonus={1} />
    </div>
  );
}

interface BonusCellProps extends AbilityRowProps {
  bonus: 1 | 2;
}

function BonusCell({ ability, grid, bonus }: BonusCellProps) {
  const allowed = grid.background?.abilityBonuses.includes(ability) ?? false;
  const hidden = grid.plan === "spread" && bonus === 1;
  if (hidden) return <span />;

  return (
    <div className="flex justify-center">
      <Checkbox
        checked={(grid.control.draft.backgroundBonuses[ability] ?? 0) === bonus}
        disabled={!allowed || grid.plan === "spread"}
        onCheckedChange={() =>
          grid.control.onChange({
            backgroundBonuses: setBonus(grid.control.draft, ability, bonus),
          })
        }
      />
    </div>
  );
}

/**
 * Le +2 et le +1 sont uniques : les poser sur une caractéristique les retire de
 * celle qui les portait. Un clic suffit, là où le cycle à trois états de la
 * version précédente en demandait quatre dans le bon ordre.
 */
function setBonus(draft: CharacterDraft, ability: Ability, bonus: 1 | 2) {
  const current = draft.backgroundBonuses[ability];
  const cleared = Object.fromEntries(
    Object.entries(draft.backgroundBonuses).filter(
      ([key, value]) => key !== ability && value !== bonus,
    ),
  );

  return current === bonus ? cleared : { ...cleared, [ability]: bonus };
}
