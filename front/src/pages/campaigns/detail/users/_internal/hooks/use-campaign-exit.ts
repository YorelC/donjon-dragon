import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CampaignDetail } from "@donjon-dragon/shared";
import { ROUTES } from "@/shared/constants/routes";
import {
  useDeleteCampaign,
  useLeaveCampaign,
  useTransferOwnership,
} from "../queries/use-campaign-exit";

export interface CampaignExit {
  isOwner: boolean;
  /** Le propriétaire ne part pas sans passer la main — sauf s'il est seul. */
  needsSuccessor: boolean;
  candidates: string[];
  successor: string;
  onSelectSuccessor: (displayName: string) => void;
  onLeave: () => void;
  onDelete: () => void;
  onTransfer: () => void;
  isBusy: boolean;
}

const NO_SUCCESSOR = "";

export function useCampaignExit(
  campaignId: string,
  campaign: CampaignDetail | null,
): CampaignExit {
  const [successor, setSuccessor] = useState(NO_SUCCESSOR);
  const actions = useExitActions(campaignId, successor);
  const candidates = candidatesOf(campaign);
  const isOwner = campaign?.isOwner ?? false;

  return {
    ...actions,
    isOwner,
    needsSuccessor: isOwner && candidates.length > 0,
    candidates,
    successor,
    onSelectSuccessor: setSuccessor,
  };
}

function useExitActions(campaignId: string, successor: string) {
  const navigate = useNavigate();
  const leave = useLeaveCampaign(campaignId);
  const remove = useDeleteCampaign(campaignId);
  const transfer = useTransferOwnership(campaignId);
  const backToList = { onSuccess: () => navigate(ROUTES.campaigns) };

  return {
    onLeave: () => leave.mutate(successor || null, backToList),
    onDelete: () => remove.mutate(undefined, backToList),
    onTransfer: () => transfer.mutate(successor),
    isBusy: leave.isPending || remove.isPending || transfer.isPending,
  };
}

/**
 * Les membres actifs autres que le propriétaire. Seul le propriétaire s'en sert —
 * pour transférer ou pour partir — donc l'exclure suffit à ne pas se proposer
 * soi-même, sans avoir à demander qui je suis au store.
 */
function candidatesOf(campaign: CampaignDetail | null): string[] {
  if (!campaign) return [];

  return [...campaign.gameMasters, ...campaign.players]
    .map((member) => member.displayName)
    .filter((displayName) => displayName !== campaign.owner.displayName);
}
