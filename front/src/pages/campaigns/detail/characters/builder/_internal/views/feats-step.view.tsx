import type {
  CatalogOriginFeat,
  DndCatalog,
  OriginFeatKey,
  SkillName,
} from "@donjon-dragon/shared";
import { skillAbilityNamesOf } from "../types/ability-hints";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { allSkillsOf, type CharacterComposition } from "../types/character-composition";
import { retainedExpertise } from "../types/builder-transitions";
import { knownSkillsExcept } from "../types/builder-lookups";
import { ChoiceButtonView } from "./choice-button.view";
import { SkillPickerView } from "./skill-picker.view";
import { MagicInitiateConfiguration } from "./magic-initiate-configuration.view";
import { FeatToolChoice } from "./feat-tool-choice.view";
import { withoutFeatTools } from "../types/builder-transitions";
import type { StepBinding } from "../types/step-binding";

interface FeatsStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}
/**
 * Les dons du personnage : celui qu'impose l'historique, celui que l'espèce
 * laisse choisir, et leurs paramétrages. Un don qui ne demande rien s'affiche
 * quand même — le joueur doit savoir ce qu'il a.
 */
export function FeatsStepView({ binding }: { binding: StepBinding }) {
  const { catalog, composition, onChange } = binding;
  const props = { catalog, composition, onChange };
  const background = catalog.backgrounds.find((entry) => entry.key === composition.backgroundKey);
  const granted = catalog.originFeats.find((feat) => feat.key === background?.originFeat);
  const chosen = catalog.originFeats.find((feat) => feat.key === composition.speciesFeat);

  return (
    <div className="flex flex-col gap-4">
      {granted ? <FeatCard feat={granted} origin="Historique"
        grantedBy={{ type: "background", key: background?.key ?? "" }} {...props} /> : null}
      <SpeciesFeatChoice binding={binding} />
      {chosen ? <FeatCard feat={chosen} origin="Espèce"
        grantedBy={{ type: "species", key: composition.speciesKey ?? "" }} {...props} /> : null}
    </div>
  );
}

/** Seul l'humain accorde un don au choix au niveau 1, par son trait Polyvalent. */
function SpeciesFeatChoice({ binding }: { binding: StepBinding }) {
  const { catalog, composition } = binding;
  const species = catalog.species.find((entry) => entry.key === composition.speciesKey);
  if (!species?.grantsOriginFeatChoice) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionHeading label={`Don d'Origines au choix (${species.name})`} />
      <div className="flex flex-wrap gap-2">
        {catalog.originFeats.map((feat) => (
          <SpeciesFeatButton key={feat.key} feat={feat} binding={binding} />
        ))}
      </div>
    </div>
  );
}

function SpeciesFeatButton({ feat, binding }: { feat: CatalogOriginFeat; binding: StepBinding }) {
  return (
    <ChoiceButtonView
      label={feat.name}
      selected={binding.composition.speciesFeat === feat.key}
      actions={{
        select: () => selectSpeciesFeat(feat.key, binding.composition, binding.onChange),
        preview: () => binding.preview(feat.key),
      }}
    />
  );
}

/**
 * Retenir le don déjà retenu ne change rien : sans cette garde, le re-clic
 * effaçait ses outils et son Initié à la magie.
 */
function selectSpeciesFeat(
  feat: OriginFeatKey,
  composition: CharacterComposition,
  onChange: FeatsStepViewProps["onChange"],
): void {
  if (feat === composition.speciesFeat) return;
  onChange({
    speciesFeat: feat,
    magicInitiateChoices: composition.magicInitiateChoices.filter(
      (choice) => choice.grantedBy.type !== "species",
    ),
    featToolChoices: withoutFeatTools(composition, composition.speciesFeat),
  });
}

interface FeatCardProps extends FeatsStepViewProps {
  feat: CatalogOriginFeat;
  origin: string;
  grantedBy: { type: "background" | "species"; key: string };
}

function FeatCard(props: FeatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-baseline justify-between gap-2">
          {props.feat.name}
          <span className="eyebrow">{props.origin}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FeatConfiguration {...props} />
      </CardContent>
    </Card>
  );
}

function FeatConfiguration(props: FeatCardProps) {
  const needsSpells = props.feat.spellcastingChoice !== null;
  const needsProficiencies = props.feat.skillOrToolChoiceCount > 0;
  const needsTools = props.feat.toolOptions.length > 0;
  if (!needsSpells && !needsProficiencies && !needsTools) return null;

  return (
    <div className="flex flex-col gap-4">
      {needsSpells ? <MagicInitiateConfiguration {...props} /> : null}
      {needsProficiencies ? <ProficiencyChoice {...props} /> : null}
      <FeatToolChoice {...props} />
    </div>
  );
}


/** Doué accorde trois maîtrises : les compétences prennent ce que les outils laissent. */
function ProficiencyChoice({ catalog, feat, composition, onChange }: FeatCardProps) {
  return (
    <SkillPickerView
      picker={{
        count: feat.skillOrToolChoiceCount - composition.featTools.length,
        options: allSkillsOf(catalog),
        selected: composition.featSkills,
        labels: catalog.skillLabels,
        abilities: skillAbilityNamesOf(catalog),
        alreadyKnown: knownSkillsExcept({ catalog, composition }, "feat"),
        onChange: (featSkills: SkillName[]) => onChange({
          featSkills,
          expertise: retainedExpertise(composition.expertise, [
            ...composition.classSkills,
            ...composition.speciesSkills,
            ...featSkills,
            ...(catalog.backgrounds.find((entry) => entry.key === composition.backgroundKey)
              ?.skillProficiencies ?? []),
          ]),
        }),
      }}
    />
  );
}
