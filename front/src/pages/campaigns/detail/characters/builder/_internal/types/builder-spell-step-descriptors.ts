import { cantripQuotaOf, spellbookSizeOf, spellQuotaOf, type StepContext } from "./builder-lookups";
import { chosenCantrips, chosenSpells } from "./builder-validity";
import { cantripKeysOf, hasSpellConflict, levelOneKeysOf } from "./chosen-spells";
import type { StepDescriptor } from "./builder-step-descriptors";

const counted = (chosen: number, total: number) => ({ chosen, total });

export const cantripsDescriptor: StepDescriptor = {
  key: "cantrips", label: "Sorts mineurs",
  isVisible: (context) => cantripQuotaOf(context) > 0,
  isValid: (context) => chosenCantrips(context.composition) >= cantripQuotaOf(context)
    && !hasSpellConflict(context, cantripKeysOf(context.composition)),
  progress: (context) => counted(chosenCantrips(context.composition), cantripQuotaOf(context)),
};

/** Le grimoire du Magicien se remplit sur la même étape que les sorts préparés. */
export const spellsDescriptor: StepDescriptor = {
  key: "spells", label: "Sorts",
  isVisible: (context) => spellQuotaOf(context) + spellbookSizeOf(context) > 0,
  isValid: (context) => chosenSpells(context.composition) === spellQuotaOf(context)
    && spellbookIsComplete(context)
    && !hasSpellConflict(context, levelOneKeysOf(context.composition)),
  progress: (context) => counted(
    chosenSpells(context.composition) + context.composition.spellbook.length,
    spellQuotaOf(context) + spellbookSizeOf(context),
  ),
};

function spellbookIsComplete(context: StepContext): boolean {
  const { spellbook } = context.composition;
  const size = spellbookSizeOf(context);
  return spellbook.length === size && new Set(spellbook).size === size;
}
