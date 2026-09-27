import type { ComputedCharacter, DndCatalog, Item } from "@donjon-dragon/shared";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import type { BuilderState } from "../hooks/use-character-builder";
import type { OptionFocus } from "../hooks/use-option-focus";
import type { StepContext } from "../types/builder-lookups";
import { toCharacterRecap, type CharacterRecap } from "../types/character-recap";
import type { AbilitiesStep } from "./abilities-step.view";
import { BuilderRailView } from "./builder-rail.view";
import { BuilderStageView } from "./builder-stage.view";
import { CharacterRecapView } from "./character-recap.view";
import type { SpellsStep } from "./spells-step.view";

export interface BuilderScreen {
  catalog: DndCatalog;
  /** Le catalogue et la composition courante, prêts pour les fonctions de lecture. */
  context: StepContext;
  /** L'option que la fiche détaillée montre au survol. */
  focus: OptionFocus;
  /** La campagne où naît le personnage ; `null` le temps qu'elle se charge. */
  campaignName: string | null;
  /** Le catalogue d'objets, pour nommer les lignes d'un paquetage. */
  items: Item[];
  builder: BuilderState;
  abilities: AbilitiesStep;
  spells: SpellsStep;
  preview: ComputedCharacter | null;
  /** Édition d'un personnage existant : son état civil est déjà figé. */
  isEditing: boolean;
  canFinish: boolean;
  isFinishing: boolean;
  finishLabel: string;
  onFinish: () => void;
}

interface CharacterBuilderViewProps {
  screen: BuilderScreen;
  /** La liste des personnages de la campagne, où ramène la sortie du créateur. */
  backTo: string;
}

/**
 * Trois panneaux : le fil conducteur, la scène de l'étape, le récapitulatif.
 * Sous `xl` le récapitulatif passe dans un tiroir de la scène ; sous `md`
 * le fil et la scène s'empilent.
 */
export function CharacterBuilderView({ screen, backTo }: CharacterBuilderViewProps) {
  const recap = recapOf(screen);

  return (
    <div className="builder-frame">
      <BuilderRailView screen={screen} />
      <BuilderStageView screen={screen} backTo={backTo} recap={recap} />
      <aside aria-label="Récapitulatif du personnage" className="panel-surface builder-recap">
        <OrnateCorners />
        <div className="panel-scroll px-[22px] py-6">
          <CharacterRecapView recap={recap} />
        </div>
      </aside>
    </div>
  );
}

function recapOf(screen: BuilderScreen): CharacterRecap {
  return toCharacterRecap({ context: screen.context, preview: screen.preview, spells: screen.spells });
}
