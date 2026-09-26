import type { BuilderStep } from "./builder-steps";
import { abilitiesDetail, featsDetail, identityDetail, invocationDetail } from "./character-detail";
import { classDetail, classOrderDetail, fightingStyleDetail } from "./class-detail";
import { equipmentDetail } from "./equipment-detail";
import { backgroundDetail, lineageDetail, speciesDetail } from "./origin-detail";
import {
  backgroundToolDetail,
  classLanguageDetail,
  classToolsDetail,
  languagesDetail,
  weaponMasteriesDetail,
} from "./proficiency-detail";
import { classSkillsDetail, expertiseDetail } from "./skill-detail";
import { cantripsDetail, spellsDetail } from "./spell-detail";
import type { DetailSource, StepDetail } from "./step-detail-parts";

/**
 * La fiche détaillée de chaque étape. Un `Record` exhaustif : une étape ajoutée
 * sans sa fiche casse `tsc` au lieu d'afficher un panneau vide.
 */
const STEP_DETAILS: Record<BuilderStep, (source: DetailSource) => StepDetail> = {
  species: speciesDetail,
  lineage: lineageDetail,
  languages: languagesDetail,
  class: classDetail,
  background: backgroundDetail,
  backgroundTool: backgroundToolDetail,
  classSkills: classSkillsDetail,
  fightingStyle: fightingStyleDetail,
  classOrder: classOrderDetail,
  weaponMasteries: weaponMasteriesDetail,
  classTools: classToolsDetail,
  classLanguage: classLanguageDetail,
  feats: featsDetail,
  expertise: expertiseDetail,
  invocation: invocationDetail,
  abilities: abilitiesDetail,
  cantrips: cantripsDetail,
  spells: spellsDetail,
  equipment: equipmentDetail,
  identity: identityDetail,
};

export function stepDetailOf(step: BuilderStep, source: DetailSource): StepDetail {
  return STEP_DETAILS[step](source);
}
