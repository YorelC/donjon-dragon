import type { ComputedCharacter } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Separator } from "@/shared/components/atoms/separator";
import { CharacterAbilitiesView } from "./character-abilities.view";
import { CharacterEquipmentView } from "./character-equipment.view";
import { CharacterFeaturesView } from "./character-features.view";
import { CharacterSkillsView } from "./character-skills.view";
import { CharacterVitalsView } from "./character-vitals.view";

interface CharacterSheetViewProps {
  name: string;
  sheet: ComputedCharacter;
  skillLabels: Partial<Record<string, string>>;
}

/**
 * La fiche calculée. Elle vit dans `shared/` parce que deux pages l'affichent :
 * le récapitulatif du builder et la fiche d'un personnage terminé. Aucune règle
 * n'est rejouée ici — tout arrive déjà résolu du serveur.
 */
export function CharacterSheetView({ name, sheet, skillLabels }: CharacterSheetViewProps) {
  return (
    <div className="grid gap-6">
      <SheetHeader name={name} sheet={sheet} />
      <CharacterVitalsView sheet={sheet} />
      <CharacterAbilitiesView sheet={sheet} />
      <Separator />
      <CharacterSkillsView sheet={sheet} labels={skillLabels} />
      <Separator />
      <CharacterEquipmentView sheet={sheet} />
      <Separator />
      <CharacterFeaturesView sheet={sheet} />
    </div>
  );
}

function SheetHeader({ name, sheet }: Omit<CharacterSheetViewProps, "skillLabels">) {
  return (
    <div className="grid gap-1">
      <h2 className="section-title text-lg">{name}</h2>
      <p className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">Niveau {sheet.level}</Badge>
        <Badge variant="outline">{sheet.speciesName}</Badge>
        {sheet.lineageName ? <Badge variant="outline">{sheet.lineageName}</Badge> : null}
        <Badge variant="outline">{sheet.className}</Badge>
        <Badge variant="outline">{sheet.backgroundName}</Badge>
        {sheet.darkvision > 0 ? (
          <Badge variant="secondary">Vision dans le noir {sheet.darkvision} m</Badge>
        ) : null}
      </p>
    </div>
  );
}
