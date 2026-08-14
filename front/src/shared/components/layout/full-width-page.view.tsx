import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface FullWidthPageProps {
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel: string;
  children: ReactNode;
}

/**
 * Les pages qui ont besoin de toute la largeur : le builder et la fiche.
 *
 * Elles sortent du layout de campagne et de son `max-w-4xl`, qui ne laissait que
 * 700 px à trois colonnes. Elles portent donc leur propre en-tête et leur propre
 * retour — sans quoi on perdrait le contexte de la campagne.
 *
 * La largeur est bornée à 100 rem : au-delà, les colonnes s'éloignent trop pour
 * se lire d'un coup d'œil.
 */
export function FullWidthPageView(props: FullWidthPageProps) {
  return (
    <div className="mx-auto max-w-[100rem] space-y-6 p-6">
      <header className="space-y-2">
        <Link to={props.backTo} className="muted-text-xs hover:underline">
          ← {props.backLabel}
        </Link>
        <h1 className="section-title text-2xl">{props.title}</h1>
        {props.subtitle ? (
          <p className="text-sm text-muted-foreground">{props.subtitle}</p>
        ) : null}
      </header>
      {props.children}
    </div>
  );
}
