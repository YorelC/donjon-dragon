import type { SkillName } from "@donjon-dragon/shared";
import { classOf, knownSkillsExcept, type StepContext } from "./builder-lookups";
import { ABILITY_LABELS } from "./character-composition";
import { formatSigned } from "./character-recap";
import {
  itemsBlock,
  proseBlock,
  type DetailBadge,
  type DetailSource,
  type StepDetail,
} from "./step-detail-parts";

/** Compétences et expertise : la compétence survolée, ou le profil maîtrisé. */
function skillsDetail(kicker: string, count: (context: StepContext) => number) {
  return (source: DetailSource): StepDetail => {
    const skill = source.focusKey as SkillName | null;
    if (skill && isSkill(source, skill)) return focusedSkillDetail(source, kicker, skill);

    return {
      kicker,
      title: `${count(source.context)} à choisir`,
      lede: "Une compétence maîtrisée ajoute votre bonus de maîtrise aux tests associés.",
      badges: [],
      blocks: [itemsBlock("Profil maîtrisé", masteredSkills(source)), savesBlock(source)],
    };
  };
}

/** Le survol peut porter une autre clé (un outil, un don) : seule une compétence a sa fiche. */
function isSkill({ context }: DetailSource, key: SkillName): boolean {
  return context.catalog.skills.some((entry) => entry.key === key) || Boolean(context.catalog.skillLabels[key]);
}

function focusedSkillDetail(source: DetailSource, kicker: string, skill: SkillName): StepDetail {
  const known = knownSkillsExcept(source.context, "class").find((entry) => entry.skill === skill);
  const origin = known ? `Déjà acquise : ${known.source}.` : "Au choix de votre liste.";

  const described = source.context.catalog.skills.find((entry) => entry.key === skill);

  return {
    kicker,
    title: source.context.catalog.skillLabels[skill] ?? described?.name ?? skill,
    lede: described?.description ?? null,
    badges: skillBadges(source, skill),
    blocks: [proseBlock("Provenance", origin)],
  };
}

/** La caractéristique vient du catalogue, le modificateur de l'aperçu serveur. */
function skillBadges({ context, preview }: DetailSource, skill: SkillName): DetailBadge[] {
  const ability = context.catalog.skills.find((entry) => entry.key === skill)?.ability;
  const resolved = preview?.skills.find((entry) => entry.skill === skill);

  return [
    ...(ability ? [{ label: "Caractéristique", value: ABILITY_LABELS[ability] }] : []),
    ...(resolved ? [{ label: "Modificateur", value: formatSigned(resolved.modifier) }] : []),
  ];
}

function masteredSkills({ context, preview }: DetailSource) {
  const mastered = preview?.skills.filter((entry) => entry.proficient) ?? [];

  return mastered.map((entry) => ({
    name: context.catalog.skillLabels[entry.skill] ?? entry.skill,
    text: `${ABILITY_LABELS[entry.ability]} · ${formatSigned(entry.modifier)}${entry.expert ? " · expertise" : ""}`,
  }));
}

function savesBlock({ preview }: DetailSource) {
  const saves = Object.values(preview?.savingThrows ?? {}).filter((save) => save.proficient);
  const body = saves.map((save) => `${ABILITY_LABELS[save.ability]} ${formatSigned(save.modifier)}`).join(" · ");

  return proseBlock("Jets de sauvegarde", body || "Calculés dès que l'aperçu est disponible.");
}

export const classSkillsDetail = skillsDetail(
  "Compétences",
  (context) => classOf(context)?.skillChoice.count ?? 0,
);

export const expertiseDetail = skillsDetail(
  "Expertise",
  (context) => classOf(context)?.expertiseCount ?? 0,
);
