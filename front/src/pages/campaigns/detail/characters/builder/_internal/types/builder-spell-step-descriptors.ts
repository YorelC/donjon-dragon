import { cantripQuotaOf, spellQuotaOf, type StepContext } from "./builder-lookups";
import { chosenCantrips, chosenSpells } from "./builder-validity";
import type { StepDescriptor } from "./builder-step-descriptors";

const counted = (chosen: number, total: number) => ({ chosen, total });

export const cantripsDescriptor: StepDescriptor = {
  key: "cantrips", label: "Sorts mineurs",
  isVisible: (context) => cantripQuotaOf(context) > 0,
  isValid: (context) => chosenCantrips(context.composition) >= cantripQuotaOf(context),
  progress: (context) => counted(chosenCantrips(context.composition), cantripQuotaOf(context)),
};

export const spellsDescriptor: StepDescriptor = {
  key: "spells", label: "Sorts",
  isVisible: (context) => spellQuotaOf(context) > 0,
  isValid: spellsAreComplete,
  progress: (context) => counted(chosenSpells(context.composition), spellQuotaOf(context)),
};

function spellsAreComplete(context: StepContext): boolean {
  if (chosenSpells(context.composition) !== spellQuotaOf(context)) return false;
  if (context.composition.classKey !== "wizard") return true;
  const { classSpells, spellbook } = context.composition;
  return spellbook.length === 6 && new Set(spellbook).size === 6
    && classSpells.every((spell) => spellbook.includes(spell));
}
