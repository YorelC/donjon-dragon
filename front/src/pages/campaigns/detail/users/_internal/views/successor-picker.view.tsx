import { Label } from "@/shared/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/atoms/select";
import type { CampaignExit } from "../hooks/use-campaign-exit";

const SUCCESSOR_SELECT_ID = "campaign-successor";

interface SuccessorPickerProps {
  exit: CampaignExit;
}

/**
 * Partagé par le départ du propriétaire et le transfert : dans les deux cas, la
 * question posée est la même — à qui revient la campagne.
 */
export function SuccessorPickerView({ exit }: SuccessorPickerProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={SUCCESSOR_SELECT_ID}>Nouveau propriétaire</Label>
      <Select
        value={exit.successor || undefined}
        onValueChange={exit.onSelectSuccessor}
      >
        <SelectTrigger id={SUCCESSOR_SELECT_ID}>
          <SelectValue placeholder="Choisis un membre" />
        </SelectTrigger>
        <SelectContent>
          {exit.candidates.map((displayName) => (
            <SelectItem key={displayName} value={displayName}>
              {displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
