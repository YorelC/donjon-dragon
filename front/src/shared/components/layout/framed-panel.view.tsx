import type { ReactNode } from "react";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";

/**
 * Le panneau de premier plan de la charte : cadre doré à équerres, contenu qui
 * défile à l'intérieur. La zone qui défile s'arrête sous les équerres du haut et
 * au-dessus de celles du bas : le contenu disparaît avant le cadre au lieu de
 * glisser dessous.
 */
export function FramedPanelView({ children }: { children: ReactNode }) {
  return (
    <main className="panel-surface relative flex min-w-0 flex-1 flex-col">
      <OrnateCorners />
      <div className="panel-scroll my-[30px] py-0">{children}</div>
    </main>
  );
}
