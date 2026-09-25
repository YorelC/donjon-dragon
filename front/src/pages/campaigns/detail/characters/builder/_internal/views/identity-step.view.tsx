import type { Alignment, DndCatalog } from "@donjon-dragon/shared";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import { Textarea } from "@/shared/components/atoms/textarea";
import type { CharacterComposition } from "../types/character-composition";
import {
  positiveIntegerFieldValue,
} from "../types/identity-fields";
import { ChoiceStepView } from "./choice-step.view";
import { MeasurementScaleView } from "./measurement-scale.view";
import { NumberFieldView } from "./number-field.view";

interface IdentityStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
  /** L'état civil se fixe à la création : le serveur ne le mute jamais ensuite. */
  isFrozen: boolean;
}

/**
 * La dernière étape : le personnage est complet, il lui manque son état civil.
 *
 * En édition, tout sauf le nom est en lecture seule. Offrir un champ dont la
 * modification répondrait `200` sans rien changer serait mentir à l'écran.
 */
export function IdentityStepView(props: IdentityStepViewProps) {
  return (
    <div className="grid gap-6">
      <NameField {...props} />
      <FrozenNotice isFrozen={props.isFrozen} />
      <AlignmentField {...props} />
      <MeasurementFields {...props} />
      <DescriptionField {...props} />
    </div>
  );
}

function NameField({ composition, onChange }: IdentityStepViewProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="character-name">Nom du personnage</Label>
      <Input
        id="character-name"
        value={composition.name}
        onChange={(event) => onChange({ name: event.target.value })}
        autoFocus
      />
    </div>
  );
}

function FrozenNotice({ isFrozen }: { isFrozen: boolean }) {
  if (!isFrozen) return null;

  return (
    <p className="text-sm text-muted-foreground">
      L’état civil se fixe à la création : il ne se modifie plus ensuite.
    </p>
  );
}

function AlignmentField({ catalog, composition, onChange, isFrozen }: IdentityStepViewProps) {
  if (isFrozen) return <ReadOnlyAlignment catalog={catalog} composition={composition} />;

  return (
    <ChoiceStepView
      title="Alignement"
      description="La boussole morale de votre personnage. Elle guide son jeu, elle ne le contraint pas."
      options={catalog.alignments.map((entry) => ({ key: entry.key, name: entry.name }))}
      selectedKey={composition.alignment}
      onSelect={(key) => onChange({ alignment: key as Alignment })}
    />
  );
}

function ReadOnlyAlignment({ catalog, composition }: Pick<
  IdentityStepViewProps,
  "catalog" | "composition"
>) {
  const label = catalog.alignments.find((entry) => entry.key === composition.alignment)?.name;

  return (
    <div className="grid gap-2">
      <Label htmlFor="character-alignment">Alignement</Label>
      <Input id="character-alignment" value={label ?? ""} disabled readOnly />
    </div>
  );
}

function MeasurementFields({ catalog, composition, onChange, isFrozen }: IdentityStepViewProps) {
  const species = catalog.species.find(
    (entry) => entry.key === composition.speciesKey,
  );

  return (
    <div className="grid gap-4">
      <NumberFieldView
        id="character-age"
        label="Âge (années)"
        value={composition.age}
        disabled={isFrozen}
        onValue={(age) => onChange({ age })}
        parse={positiveIntegerFieldValue}
      />
      {species ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <MeasurementScaleView
            disabled={isFrozen}
            measurement={{
              id: "character-height",
              label: "Taille",
              unit: "cm",
              range: species.physicalBounds.heightCm,
              value: composition.heightCm,
              onValue: (heightCm) => onChange({ heightCm }),
            }}
          />
          <MeasurementScaleView
            disabled={isFrozen}
            measurement={{
              id: "character-weight",
              label: "Poids",
              unit: "kg",
              range: species.physicalBounds.weightKg,
              value: composition.weightKg,
              onValue: (weightKg) => onChange({ weightKg }),
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function DescriptionField({ composition, onChange, isFrozen }: IdentityStepViewProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="character-description">Description (facultative)</Label>
      <Textarea
        id="character-description"
        value={composition.description ?? ""}
        disabled={isFrozen}
        onChange={(event) => onChange({ description: event.target.value || null })}
      />
    </div>
  );
}
