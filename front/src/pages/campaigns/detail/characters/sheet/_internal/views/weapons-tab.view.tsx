import type { ResolvedAttack } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import type { HoverBinding } from "../types/hover-binding";
import { formatSigned } from "../utils/sheet-format";
import { attackKey, toAttackNote, toDamageLabel, toWeaponDetail } from "../utils/weapon-detail";
import { SheetDetailAsideView } from "./sheet-detail-aside.view";

interface WeaponsTabViewProps {
  attacks: ResolvedAttack[];
  hover: HoverBinding<ResolvedAttack>;
}

const ATTACK_GRID = "grid grid-cols-[minmax(0,1fr)_48px_96px] items-center gap-2";
const HINT = "Survolez une attaque pour sa portée, sa maîtrise et le détail de son bonus.";

export function WeaponsTabView({ attacks, hover }: WeaponsTabViewProps) {
  return (
    <div className="sheet-tab-split">
      <div className="flex min-w-0 flex-col gap-[11px]">
        <SectionHeading label="Attaques d'armes" />
        <AttackList attacks={attacks} hover={hover} />
      </div>
      <SheetDetailAsideView
        title="Fiche de l'arme"
        hint={HINT}
        detail={hover.current ? toWeaponDetail(hover.current) : null}
      />
    </div>
  );
}

function AttackList({ attacks, hover }: WeaponsTabViewProps) {
  if (attacks.length === 0) return <p className="empty-state-text">Aucune arme en main.</p>;

  return (
    <>
      <div className={cn(ATTACK_GRID, "border-b border-gold/14 px-3 pb-[7px]")}>
        <span className="sheet-caption">Nom</span>
        <span className="sheet-caption text-center">Bonus</span>
        <span className="sheet-caption text-center">Dégâts / type</span>
      </div>
      <ul className="flex flex-col gap-[7px]">
        {attacks.map((attack) => (
          <AttackRow key={attackKey(attack)} attack={attack} hover={hover} />
        ))}
      </ul>
    </>
  );
}

interface AttackRowProps {
  attack: ResolvedAttack;
  hover: HoverBinding<ResolvedAttack>;
}

function AttackRow({ attack, hover }: AttackRowProps) {
  return (
    <li
      tabIndex={0}
      onMouseEnter={() => hover.onEnter(attack)}
      onMouseLeave={hover.onLeave}
      onFocus={() => hover.onEnter(attack)}
      onBlur={hover.onLeave}
      className={cn("sheet-row cursor-help", ATTACK_GRID)}
    >
      <div className="flex min-w-0 flex-col gap-[3px]">
        <span className="text-sm/[1.35] text-gold-selected">{attack.name}</span>
        <span className="text-overline/[1.35] tracking-meta text-ink-meta">{toAttackNote(attack)}</span>
      </div>
      <span className="text-center font-display text-base text-gold-value">
        {formatSigned(attack.attackBonus)}
      </span>
      <span className="text-center text-body text-ink-idle">{toDamageLabel(attack)}</span>
    </li>
  );
}
