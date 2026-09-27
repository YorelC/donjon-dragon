import type { IssuedAbilityRoll } from "@donjon-dragon/shared";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useRollAbilities } from "../queries/use-character-creation";
import { abilityHintsOf } from "../types/ability-hints";
import { backgroundOf, type StepContext } from "../types/builder-lookups";
import type { AbilitiesStep } from "../views/abilities-step.view";
import type { BuilderState } from "./use-character-builder";

/** Seul le MJ de la campagne peut saisir les scores à la main. */
export function useAbilitiesStep(
  campaignId: string,
  builder: BuilderState,
  context: StepContext | null,
): AbilitiesStep {
  const { data: campaign } = useCampaignDetail(campaignId);
  const rollAbilities = useRollAbilities(campaignId);

  return {
    roll: builder.composition.abilityRoll,
    onRoll: () => rollAbilities.mutate(undefined, { onSuccess: (issued) => keep(builder, issued) }),
    isRolling: rollAbilities.isPending,
    background: context ? backgroundOf(context) ?? null : null,
    canSetManually: campaign?.myRole === "gameMaster",
    hints: context ? abilityHintsOf(context.catalog) : {},
  };
}

/** Les dés servent à l'affichage, l'identité au serveur : on garde les deux. */
function keep(builder: BuilderState, issued: IssuedAbilityRoll): void {
  builder.update({
    abilityRoll: { dice: issued.dice, totals: issued.totals },
    abilityRollId: issued.rollId,
  });
}
