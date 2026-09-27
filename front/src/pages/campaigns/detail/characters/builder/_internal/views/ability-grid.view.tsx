import type { Ability, CatalogBackground } from "@donjon-dragon/shared";
import { Checkbox } from "@/shared/components/atoms/checkbox";
import { ABILITIES, ABILITY_LABELS, type CharacterComposition } from "../types/character-composition";
import type { AbilityHints } from "../types/ability-hints";
import { AbilityNameView } from "./ability-name.view";
import { AbilityValueControlView, type ValueControl } from "./ability-value-control.view";

export type BonusPlan = "focused" | "spread";

export interface AbilityGrid {
  control: ValueControl;
  background: CatalogBackground | null;
  hints: AbilityHints;
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
    <div className="flex flex-col gap-1.5">
      <GridHeader grid={grid} />
      {ABILITIES.map((ability) => (
        <AbilityRow key={ability} ability={ability} grid={grid} />
      ))}
    </div>
  );
}

const ROW_COLUMNS = "grid grid-cols-[minmax(4.5rem,1fr)_auto_1.5rem_1.5rem] items-center gap-1.5";

function GridHeader({ grid }: AbilityGridViewProps) {
  return (
    <div className={`${ROW_COLUMNS} sheet-caption px-2.5`}>
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
  const primaryBonus = grid.plan === "spread" ? 1 : 2;

  return (
    <div className={`${ROW_COLUMNS} panel-flat px-2 py-2`}>
      <AbilityNameView label={ABILITY_LABELS[ability]} hint={grid.hints[ability]} />
      <AbilityValueControlView ability={ability} control={grid.control} />
      <BonusCell ability={ability} grid={grid} bonus={primaryBonus} />
      {grid.plan === "spread" ? <span /> : <BonusCell ability={ability} grid={grid} bonus={1} />}
    </div>
  );
}

interface BonusCellProps extends AbilityRowProps {
  bonus: 1 | 2;
}

function BonusCell({ ability, grid, bonus }: BonusCellProps) {
  const allowed = grid.background?.abilityBonuses.includes(ability) ?? false;

  return (
    <div className="flex justify-center">
      {/* Sans nom accessible, six cases identiques se suivent sans qu'on sache
          laquelle porte quel bonus, ni sur quelle caractéristique. */}
      <Checkbox
        aria-label={`${ABILITY_LABELS[ability]} +${bonus}`}
        className={allowed ? "border-gold/60" : "opacity-30"}
        checked={(grid.control.composition.backgroundBonuses[ability] ?? 0) === bonus}
        disabled={!allowed || grid.plan === "spread"}
        onCheckedChange={() =>
          grid.control.onChange({
            backgroundBonuses: setBonus(grid.control.composition, ability, bonus),
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
function setBonus(composition: CharacterComposition, ability: Ability, bonus: 1 | 2) {
  const current = composition.backgroundBonuses[ability];
  const cleared = Object.fromEntries(
    Object.entries(composition.backgroundBonuses).filter(
      ([key, value]) => key !== ability && value !== bonus,
    ),
  );

  return current === bonus ? cleared : { ...cleared, [ability]: bonus };
}
