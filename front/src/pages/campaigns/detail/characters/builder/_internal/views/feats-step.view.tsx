import type {
  Ability,
  CatalogOriginFeat,
  ClassKey,
  DndCatalog,
  OriginFeatKey,
  SkillName,
} from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { Separator } from "@/shared/components/atoms/separator";
import { ABILITY_LABELS, allSkillsOf, type CharacterComposition } from "../types/character-composition";
import { knownSkillsExcept } from "../types/builder-lookups";
import { ChoiceButtonView } from "./choice-button.view";
import { SkillPickerView } from "./skill-picker.view";

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
      {granted ? <FeatCard feat={granted} origin="Historique" {...props} /> : null}
      <SpeciesFeatChoice {...props} />
      {chosen ? <FeatCard feat={chosen} origin="Espèce" {...props} /> : null}
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
            onSelect={() => onChange({ speciesFeat: feat.key as OriginFeatKey })}
          />
        ))}
      </div>
    </div>
  );
}

interface FeatCardProps extends FeatsStepViewProps {
  feat: CatalogOriginFeat;
  origin: string;
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
      {needsSpells ? <SpellListChoice {...props} /> : null}
      {needsProficiencies ? <ProficiencyChoice {...props} /> : null}
    </div>
  );
}

/** Initié à la magie : la liste où puiser, et la caractéristique qui l'anime. */
function SpellListChoice({ catalog, feat, composition, onChange }: FeatCardProps) {
  const choice = feat.spellcastingChoice;
  if (!choice) return null;

  return (
    <div className="grid gap-3">
      <ChoiceRow label="Liste de sorts">
        {choice.spellListOptions.map((classKey) => (
          <ChoiceButtonView
            key={classKey}
            label={catalog.classes.find((entry) => entry.key === classKey)?.name ?? classKey}
            selected={composition.spellList === classKey}
            onSelect={() => onChange({ spellList: classKey as ClassKey, featSpells: [] })}
          />
        ))}
      </ChoiceRow>
      <ChoiceRow label="Caractéristique d'incantation">
        {choice.abilityOptions.map((ability) => (
          <ChoiceButtonView
            key={ability}
            label={ABILITY_LABELS[ability as Ability]}
            selected={composition.spellcastingAbility === ability}
            onSelect={() => onChange({ spellcastingAbility: ability as Ability })}
          />
        ))}
      </ChoiceRow>
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
        onChange: (featSkills: SkillName[]) => onChange({ featSkills }),
      }}
    />
  );
}

function ChoiceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
