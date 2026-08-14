import type {
  Ability,
  CatalogOriginFeat,
  ClassKey,
  DndCatalog,
  OriginFeatKey,
  SkillName,
} from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { Separator } from "@/shared/components/atoms/separator";
import { ABILITY_LABELS, allSkillsOf, type CharacterDraft } from "../types/character-draft";
import { knownSkillsExcept } from "../types/builder-lookups";
import { SkillPickerView } from "./skill-picker.view";

interface FeatsStepViewProps {
  catalog: DndCatalog;
  draft: CharacterDraft;
  onChange: (patch: Partial<CharacterDraft>) => void;
}

/**
 * Les dons du personnage : celui qu'impose l'historique, celui que l'espèce
 * laisse choisir, et leurs paramétrages. Un don qui ne demande rien s'affiche
 * quand même — le joueur doit savoir ce qu'il a.
 */
export function FeatsStepView(props: FeatsStepViewProps) {
  const { catalog, draft } = props;
  const background = catalog.backgrounds.find((entry) => entry.key === draft.backgroundKey);
  const granted = catalog.originFeats.find((feat) => feat.key === background?.originFeat);
  const chosen = catalog.originFeats.find((feat) => feat.key === draft.speciesFeat);

  return (
    <div className="grid gap-4">
      {granted ? <FeatCard feat={granted} origin="Historique" {...props} /> : null}
      <SpeciesFeatChoice {...props} />
      {chosen ? <FeatCard feat={chosen} origin="Espèce" {...props} /> : null}
    </div>
  );
}

/** Seul l'humain accorde un don au choix au niveau 1, par son trait Polyvalent. */
function SpeciesFeatChoice({ catalog, draft, onChange }: FeatsStepViewProps) {
  const species = catalog.species.find((entry) => entry.key === draft.speciesKey);
  if (!species?.grantsOriginFeatChoice) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Don d'Origines au choix ({species.name})</h3>
      <div className="flex flex-wrap gap-2">
        {catalog.originFeats.map((feat) => (
          <Button
            key={feat.key}
            type="button"
            size="sm"
            variant={draft.speciesFeat === feat.key ? "default" : "outline"}
            onClick={() => onChange({ speciesFeat: feat.key as OriginFeatKey })}
          >
            {feat.name}
          </Button>
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
function SpellListChoice({ catalog, feat, draft, onChange }: FeatCardProps) {
  const choice = feat.spellcastingChoice;
  if (!choice) return null;

  return (
    <div className="grid gap-3">
      <ChoiceRow label="Liste de sorts">
        {choice.spellListOptions.map((classKey) => (
          <Button
            key={classKey}
            type="button"
            size="sm"
            variant={draft.spellList === classKey ? "default" : "outline"}
            onClick={() => onChange({ spellList: classKey as ClassKey, featSpells: [] })}
          >
            {catalog.classes.find((entry) => entry.key === classKey)?.name ?? classKey}
          </Button>
        ))}
      </ChoiceRow>
      <ChoiceRow label="Caractéristique d'incantation">
        {choice.abilityOptions.map((ability) => (
          <Button
            key={ability}
            type="button"
            size="sm"
            variant={draft.spellcastingAbility === ability ? "default" : "outline"}
            onClick={() => onChange({ spellcastingAbility: ability as Ability })}
          >
            {ABILITY_LABELS[ability as Ability]}
          </Button>
        ))}
      </ChoiceRow>
    </div>
  );
}

/** Doué accorde trois maîtrises ; on ne propose ici que les compétences. */
function ProficiencyChoice({ catalog, feat, draft, onChange }: FeatCardProps) {
  return (
    <SkillPickerView
      picker={{
        count: feat.skillOrToolChoiceCount,
        options: allSkillsOf(catalog),
        selected: draft.featSkills,
        labels: catalog.skillLabels,
        alreadyKnown: knownSkillsExcept({ catalog, draft }, "feat"),
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
