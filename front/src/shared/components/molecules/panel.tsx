import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import { SectionHeading } from "@/shared/components/molecules/section-heading";

interface PanelProps {
  heading?: string;
  frame?: "plain" | "ornate";
  children: ReactNode;
}

/**
 * Panneau principal : cadre doré, dégradé d'encre et ombre interne. Le cadre
 * `ornate` ajoute les quatre équerres réservées au premier plan.
 */
function Panel({ heading, frame = "plain", children }: PanelProps) {
  return (
    <section className={cn("panel", heading && "flex flex-col gap-5")}>
      {frame === "ornate" ? <OrnateCorners /> : null}
      {heading ? <SectionHeading label={heading} /> : null}
      {children}
    </section>
  );
}

/** Encart interne d'un panneau : même grammaire, un cran plus clair. */
function PanelInset({ children }: { children: ReactNode }) {
  return <div className="panel-inset">{children}</div>;
}

export { Panel, PanelInset };
