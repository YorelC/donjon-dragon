import { Button } from "@/shared/components/atoms/button";

interface OwnerRoleToggleProps {
  isGameMaster: boolean;
  onPromote: () => void;
  onDemote: () => void;
  isPending: boolean;
}

export function OwnerRoleToggleView({
  isGameMaster,
  onPromote,
  onDemote,
  isPending,
}: OwnerRoleToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={isGameMaster ? onDemote : onPromote}
    >
      {isGameMaster ? "Redevenir joueur" : "Devenir maître du jeu"}
    </Button>
  );
}
