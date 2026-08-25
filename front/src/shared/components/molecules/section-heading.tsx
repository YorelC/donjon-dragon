import { GoldRule } from "@/shared/components/molecules/gold-rule";

interface SectionHeadingProps {
  label: string;
}

/** Intitulé de section : capitales espacées en Cinzel, puis un filet qui s'éteint. */
function SectionHeading({ label }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="section-label">{label}</span>
      <GoldRule />
    </div>
  );
}

/** Variante encadrée, pour un intitulé centré au-dessus d'une liste condensée. */
function FramedHeading({ label }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div aria-hidden className="rule-line-reverse" />
      <span className="section-label">{label}</span>
      <GoldRule />
    </div>
  );
}

export { SectionHeading, FramedHeading };
