import { Diamond } from "@/shared/components/molecules/diamond";
import { DiamondRule } from "@/shared/components/molecules/gold-rule";
import { FramedHeading } from "@/shared/components/molecules/section-heading";
import { StatToken } from "@/shared/components/molecules/stat-token";
import { cn } from "@/shared/utils/utils";
import type { CharacterRecap, RecapAbility, RecapStat } from "../types/character-recap";
import type { RecapLine } from "../types/recap-proficiencies";
import type { RecapTokenGroup } from "../types/recap-tokens";

/** Le récapitulatif : qui est le personnage, et ce qu'il vaut en un coup d'œil. */
export function CharacterRecapView({ recap }: { recap: CharacterRecap }) {
  return (
    <div className="flex flex-col gap-[18px]">
      <RecapCrest recap={recap} />
      <RecapAbilities abilities={recap.abilities} />
      <RecapStats stats={recap.stats} />
      {recap.tokenGroups.map((group) => (
        <RecapTokens key={group.heading} group={group} />
      ))}
      <RecapProficiencies lines={recap.proficiencies} />
      <RecapVitals vitals={recap.vitals} />
    </div>
  );
}

function RecapCrest({ recap }: { recap: CharacterRecap }) {
  return (
    <header className="flex flex-col items-center gap-2.5">
      <Diamond size="crest" tone="active">{recap.crest}</Diamond>
      <div className="flex w-full flex-col items-center gap-0.5 text-center">
        <p className="font-display text-xl tracking-meta text-pretty text-gold-selected">
          {recap.name}
        </p>
        <div className="my-1.5 w-full"><DiamondRule /></div>
        <span className="font-display text-[15px] tracking-display text-gold-value">
          {recap.origin}
        </span>
        <span className="text-sm tracking-title text-ink-meta">{recap.classLine}</span>
        <span className="mt-[3px] text-label tracking-section text-gold/80 uppercase">
          {recap.alignment}
        </span>
      </div>
    </header>
  );
}

function RecapAbilities({ abilities }: { abilities: RecapAbility[] }) {
  return (
    <div className="grid grid-cols-6 gap-1 border-y border-gold/16 px-1 py-3">
      {abilities.map((ability) => (
        <RecapAbilityColumn key={ability.ability} ability={ability} />
      ))}
    </div>
  );
}

/** L'étoile marque une caractéristique principale de la classe ; absente, elle garde sa place. */
function RecapAbilityColumn({ ability }: { ability: RecapAbility }) {
  return (
    <div className="flex flex-col items-center gap-[3px]">
      <span aria-hidden className={cn("text-[9px] text-gold-value", !ability.primary && "invisible")}>
        ★
      </span>
      <span className="font-display text-label tracking-meta text-ink-meta uppercase">
        {ability.short}
      </span>
      <span className="font-display text-lg text-gold-title">{ability.score}</span>
      <span className="text-[11px] text-ink-faint">{ability.modifier}</span>
    </div>
  );
}

function RecapStats({ stats }: { stats: RecapStat[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {stats.map((stat) => (
        <RecapChip key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

/** L'espace entre libellé et valeur est un vrai caractère : « PV 13 » se lit d'un bloc. */
function RecapChip({ stat }: { stat: RecapStat }) {
  return (
    <div className="sheet-chip">
      <span className="sheet-caption">{stat.label}</span>{" "}
      <span className="font-display text-base text-gold-title">{stat.value}</span>
    </div>
  );
}

function RecapTokens({ group }: { group: RecapTokenGroup }) {
  return (
    <div className="flex flex-col gap-[11px]">
      <FramedHeading label={group.heading} />
      <div className="flex flex-wrap justify-center gap-[9px]">
        {group.tokens.map((token) => (
          <StatToken key={token.name} token={token} />
        ))}
      </div>
    </div>
  );
}

function RecapProficiencies({ lines }: { lines: RecapLine[] }) {
  return (
    <div className="flex flex-col gap-[11px]">
      <FramedHeading label="Maîtrises" />
      <div className="flex flex-col gap-2">
        {lines.map((line) => (
          <RecapProficiencyLine key={line.name} line={line} />
        ))}
      </div>
    </div>
  );
}

function RecapProficiencyLine({ line }: { line: RecapLine }) {
  return (
    <p className="text-body/[1.6]">
      <span className="text-foreground">{line.name}</span>
      <span className="text-gold/60"> — </span>
      <span className="text-ink-value">{line.value}</span>
    </p>
  );
}

function RecapVitals({ vitals }: { vitals: RecapStat[] }) {
  return (
    <div className="flex justify-between gap-2 border-t border-gold/16 pt-3.5">
      {vitals.map((vital) => (
        <RecapVital key={vital.label} vital={vital} />
      ))}
    </div>
  );
}

function RecapVital({ vital }: { vital: RecapStat }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[3px] text-center">
      <span className="sheet-caption">{vital.label}</span>
      <span className="font-display text-sm text-gold-value">{vital.value}</span>
    </div>
  );
}
