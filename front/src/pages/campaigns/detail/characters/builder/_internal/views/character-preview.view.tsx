import type { ComputedCharacter, DndCatalog } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Separator } from "@/shared/components/atoms/separator";
import { ABILITIES, ABILITY_LABELS, type CharacterDraft } from "../types/character-draft";
import { backgroundOf, classOf, speciesOf } from "../types/builder-lookups";

interface CharacterPreviewViewProps {
  catalog: DndCatalog;
  draft: CharacterDraft;
  preview: ComputedCharacter | null;
  characterName: string;
}

/**
 * Le résumé qui accompagne toute la création.
 *
 * Il affiche les choix bruts dès le premier écran, et les valeurs calculées dès
 * que l'aperçu du serveur répond — ce qui n'arrive qu'une fois l'espèce, la
 * classe et l'historique choisis. C'est ce décalage qui justifie les deux
 * sources : sans lui le panneau resterait vide pendant trois étapes.
 */
export function CharacterPreviewView(props: CharacterPreviewViewProps) {
  return (
    <aside className="grid content-start gap-4 rounded-lg border p-4">
      <Identity {...props} />
      <Separator />
      <Abilities {...props} />
      {props.preview ? <Vitals preview={props.preview} /> : null}
      <Proficiencies {...props} />
    </aside>
  );
}

function Identity({ catalog, draft, characterName }: CharacterPreviewViewProps) {
  const context = { catalog, draft };
  const species = speciesOf(context);
  const lineage = species?.lineage?.options.find((entry) => entry.key === draft.lineageKey);

  return (
    <div className="grid gap-1">
      <p className="section-title text-base">{characterName}</p>
      <p className="text-sm text-muted-foreground">
        {[lineage?.name ?? species?.name, classOf(context)?.name].filter(Boolean).join(" · ") ||
          "Personnage à créer"}
      </p>
      {backgroundOf(context) ? (
        <p className="text-xs text-muted-foreground">{backgroundOf(context)?.name}</p>
      ) : null}
    </div>
  );
}

function Abilities({ preview, draft }: CharacterPreviewViewProps) {
  return (
    <div className="grid grid-cols-6 gap-1 text-center">
      {ABILITIES.map((ability) => (
        <div key={ability}>
          <p className="text-[0.65rem] uppercase text-muted-foreground">
            {ABILITY_LABELS[ability].slice(0, 3)}
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {preview?.abilities[ability].score ?? draft.pointBuyScores[ability]}
          </p>
        </div>
      ))}
    </div>
  );
}

function Vitals({ preview }: { preview: ComputedCharacter }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">PV {preview.maxHitPoints.value}</Badge>
      <Badge variant="outline">CA {preview.armorClass.value}</Badge>
      <Badge variant="outline">Init. {formatSigned(preview.initiative.value)}</Badge>
      <Badge variant="outline">Vitesse {preview.speed.value} m</Badge>
    </div>
  );
}

function Proficiencies({ catalog, draft, preview }: CharacterPreviewViewProps) {
  const skills = preview?.proficiencies.skills ?? [
    ...draft.classSkills,
    ...draft.speciesSkills,
    ...draft.featSkills,
  ];
  if (skills.length === 0) return null;

  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium uppercase text-muted-foreground">Compétences</p>
      <p className="text-sm">
        {skills.map((skill) => catalog.skillLabels[skill] ?? skill).join(", ")}
      </p>
    </div>
  );
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}
