import type {
  CatalogOriginFeat,
  DndCatalog,
  OriginFeatKey,
  SkillName,
} from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { Separator } from "@/shared/components/atoms/separator";
import { allSkillsOf, type CharacterComposition } from "../types/character-composition";
import { retainedExpertise } from "../types/builder-transitions";
import { knownSkillsExcept } from "../types/builder-lookups";
import { ChoiceButtonView } from "./choice-button.view";
import { SkillPickerView } from "./skill-picker.view";
import { MagicInitiateConfiguration } from "./magic-initiate-configuration.view";

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
export function FeatsStepView(props: FeatsStepViewProps) {
  const { catalog, composition } = props;
  const background = catalog.backgrounds.find((entry) => entry.key === composition.backgroundKey);
  const granted = catalog.originFeats.find((feat) => feat.key === background?.originFeat);
  const chosen = catalog.originFeats.find((feat) => feat.key === composition.speciesFeat);

  return (
    <div className="grid gap-4">
      {granted ? <FeatCard feat={granted} origin="Historique"
        grantedBy={{ type: "background", key: background?.key ?? "" }} {...props} /> : null}
      <SpeciesFeatChoice {...props} />
      {chosen ? <FeatCard feat={chosen} origin="Espèce"
        grantedBy={{ type: "species", key: composition.speciesKey ?? "" }} {...props} /> : null}
    </div>
  );
}

/** Seul l'humain accorde un don au choix au niveau 1, par son trait Polyvalent. */
function SpeciesFeatChoice({ catalog, composition, onChange }: FeatsStepViewProps) {
  const species = catalog.species.find((entry) => entry.key === composition.speciesKey);
  if (!species?.grantsOriginFeatChoice) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Don d'Origines au choix ({species.name})</h3>
      <div className="flex flex-wrap gap-2">
        {catalog.originFeats.map((feat) => (
          <ChoiceButtonView
            key={feat.key}
            label={feat.name}
            selected={composition.speciesFeat === feat.key}
            onSelect={() => onChange({
              speciesFeat: feat.key as OriginFeatKey,
              magicInitiateChoices: composition.magicInitiateChoices.filter(
                (choice) => choice.grantedBy.type !== "species",
              ),
            })}
          />
        ))}
      </div>
    </div>
  );
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
        <CardTitle className="flex items-center gap-2 text-base">
          {props.feat.name}
          <Badge variant="secondary">{props.origin}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">{props.feat.description}</p>
        <FeatConfiguration {...props} />
      </CardContent>
    </Card>
  );
}

function FeatConfiguration(props: FeatCardProps) {
  const needsSpells = props.feat.spellcastingChoice !== null;
  const needsProficiencies = props.feat.skillOrToolChoiceCount > 0;
  if (!needsSpells && !needsProficiencies) return null;

  return (
    <div className="grid gap-4">
      <Separator />
      {needsSpells ? <MagicInitiateConfiguration {...props} /> : null}
      {needsProficiencies ? <ProficiencyChoice {...props} /> : null}
    </div>
  );
}


/** Doué accorde trois maîtrises ; on ne propose ici que les compétences. */
function ProficiencyChoice({ catalog, feat, composition, onChange }: FeatCardProps) {
  return (
    <SkillPickerView
      picker={{
        count: feat.skillOrToolChoiceCount,
        options: allSkillsOf(catalog),
        selected: composition.featSkills,
        labels: catalog.skillLabels,
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
