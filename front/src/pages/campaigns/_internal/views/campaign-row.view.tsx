import { Link } from "react-router-dom";
import type { CampaignRole, CampaignSummary } from "@donjon-dragon/shared";
import { buttonVariants } from "@/shared/components/atoms/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/atoms/tooltip";
import { Diamond } from "@/shared/components/molecules/diamond";
import { toCampaignDetail } from "@/shared/constants/routes";
import { cn } from "@/shared/utils/utils";
import { toCampaignHeadcount } from "../utils/campaign-meta";

/**
 * La ligne entière ouvre la campagne, alors qu'elle ne contient qu'UN lien : le
 * bouton « Ouvrir » est étiré par son `::after` sur toute la ligne. Deux éléments
 * cliquables imbriqués seraient invalides et injouables au clavier.
 */
export function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  return (
    <li className="relative flex items-center justify-between gap-5 border border-gold/16 bg-surface px-5 py-4 transition-[border-color] duration-[.18s] hover:border-gold/40">
      <CampaignIdentity campaign={campaign} />
      <OpenCampaignLink campaign={campaign} />
    </li>
  );
}

function CampaignIdentity({ campaign }: { campaign: CampaignSummary }) {
  return (
    <div className="flex min-w-0 items-center gap-[18px]">
      <CampaignStanding campaign={campaign} />
      <div className="flex min-w-0 flex-col gap-[5px]">
        <span className="truncate font-display text-base tracking-meta text-gold-title">
          {campaign.name}
        </span>
        <span className="meta-line truncate">
          {toCampaignHeadcount(campaign)}
        </span>
      </div>
    </div>
  );
}

/**
 * Le losange dit le rôle, l'anneau dit la propriété : être maître du jeu et avoir
 * créé la campagne sont deux choses. Le marqueur passe devant le lien étiré, sinon
 * son infobulle serait recouverte.
 */
function CampaignStanding({ campaign }: { campaign: CampaignSummary }) {
  const role = ROLE_LABELS[campaign.myRole];
  const ownership = OWNERSHIP_NOTES[toOwnership(campaign.isOwner)];

  return (
    <Tooltip>
      <TooltipTrigger className="relative z-10 flex size-[26px] shrink-0 cursor-help items-center justify-center">
        <OwnershipRing isOwner={campaign.isOwner} />
        <Diamond tone={ROLE_TONES[campaign.myRole]} />
        <span className="sr-only">{`${role}. ${ownership}`}</span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span data-slot="tooltip-title" className="block">
          {role}
        </span>
        <span className="mt-[5px] block">{ownership}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function OwnershipRing({ isOwner }: { isOwner: boolean }) {
  if (!isOwner) return null;

  return <span aria-hidden className="absolute size-6 rotate-45 border border-gold/50" />;
}

/** Le nom entre dans l'intitulé : toutes les lignes portent le même mot « Ouvrir ». */
function OpenCampaignLink({ campaign }: { campaign: CampaignSummary }) {
  return (
    <Link
      to={toCampaignDetail(campaign.id)}
      aria-label={`Ouvrir ${campaign.name}`}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "after:absolute after:inset-0 after:content-['']",
      )}
    >
      Ouvrir
    </Link>
  );
}

const ROLE_LABELS: Record<CampaignRole, string> = {
  gameMaster: "Maître du jeu",
  player: "Joueur",
};

const ROLE_TONES: Record<CampaignRole, "filled" | "idle"> = {
  gameMaster: "filled",
  player: "idle",
};

const OWNERSHIP_NOTES = {
  owned: "Vous êtes propriétaire de cette campagne.",
  guest: "Campagne créée par un autre joueur.",
} as const;

function toOwnership(isOwner: boolean): keyof typeof OWNERSHIP_NOTES {
  return isOwner ? "owned" : "guest";
}
