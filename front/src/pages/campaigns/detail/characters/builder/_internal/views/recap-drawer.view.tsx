import { Button } from "@/shared/components/atoms/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/atoms/sheet";
import { Diamond } from "@/shared/components/molecules/diamond";
import type { CharacterRecap } from "../types/character-recap";
import { CharacterRecapView } from "./character-recap.view";

/**
 * Sous `xl`, le récapitulatif quitte sa colonne pour un tiroir : la scène garde
 * la place de ses deux colonnes, le personnage reste à un clic.
 */
export function RecapDrawerView({ recap }: { recap: CharacterRecap }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="xl:hidden">
          <Diamond tone="filled" />
          Récapitulatif
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[372px] max-w-[92vw] gap-0 sm:max-w-[372px]"
        onOpenAutoFocus={focusDrawer}
      >
        <SheetTitle className="sr-only">Récapitulatif du personnage</SheetTitle>
        <div className="panel-scroll px-[22px] py-6">
          <CharacterRecapView recap={recap} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Le focus automatique tombait sur le premier jeton, dont l'infobulle s'ouvrait
 * seule à chaque ouverture. Le tiroir reçoit le focus lui-même : il reste piégé
 * dedans pour le clavier, sans rien déplier.
 */
function focusDrawer(event: Event): void {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
}
