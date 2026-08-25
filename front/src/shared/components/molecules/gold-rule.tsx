import { Diamond } from "@/shared/components/molecules/diamond";

/** Filet dégradé qui s'éteint vers la droite, sous un intitulé aligné à gauche. */
function GoldRule() {
  return <div aria-hidden className="rule-line" />;
}

/**
 * Filet à losange : deux filets qui s'éteignent vers le losange, sous un titre
 * centré. L'or est vif aux extrémités, le losange tient le centre à lui seul.
 */
function DiamondRule() {
  return (
    <div className="flex w-full items-center gap-2.5">
      <div aria-hidden className="rule-line" />
      <Diamond size="tick" tone="filled" />
      <div aria-hidden className="rule-line-reverse" />
    </div>
  );
}

export { GoldRule, DiamondRule };
