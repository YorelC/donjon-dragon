import { Progress } from "@/shared/components/atoms/progress";
import { JourneyStep } from "@/shared/components/molecules/journey-step";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import { journeyOf, type JourneyEntry, type JourneyProgress } from "../types/builder-journey";
import type { BuilderScreen } from "./character-builder.view";

/**
 * Le fil conducteur. Il s'allonge selon les choix — un elfe fait apparaître son
 * lignage, un guerrier son Style de combat — et dit d'un coup d'œil où l'on en
 * est : la valeur retenue sous chaque étape, une coche quand elle est franchie.
 */
export function BuilderRailView({ screen }: { screen: BuilderScreen }) {
  const journey = journeyOf(screen.builder, screen.context);

  return (
    <nav aria-label="Étapes de création" className="panel-surface builder-rail">
      <OrnateCorners />
      <div className="panel-scroll px-5 py-[26px]">
        <RailHeader progress={journey.progress} campaignName={screen.campaignName} />
        <ol className="flex flex-col gap-0.5">
          {journey.entries.map((entry) => (
            <RailEntry key={entry.step} entry={entry} onSelect={screen.builder.goTo} />
          ))}
        </ol>
      </div>
    </nav>
  );
}

interface RailHeaderProps {
  progress: JourneyProgress;
  campaignName: string | null;
}

function RailHeader({ progress, campaignName }: RailHeaderProps) {
  return (
    <div className="flex flex-col gap-2 px-2 pb-5">
      <span className="section-label">Création de personnage</span>
      {campaignName ? <span className="text-body tracking-name text-gold-value">{campaignName}</span> : null}
      <span className="text-xs tracking-meta text-ink-faint">
        Règles 2024 · niveau 1 · étapes {progress.valid}/{progress.total}
      </span>
      <Progress
        value={progress.percent}
        aria-label="Progression de la création"
        className="mt-1 h-0.5 border-0 bg-gold/10"
      />
    </div>
  );
}

interface RailEntryProps {
  entry: JourneyEntry;
  onSelect: BuilderScreen["builder"]["goTo"];
}

function RailEntry({ entry, onSelect }: RailEntryProps) {
  return (
    <li>
      <JourneyStep step={entry.data} state={entry.state} onSelect={() => onSelect(entry.step)} />
    </li>
  );
}
