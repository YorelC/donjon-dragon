import { Diamond } from "@/shared/components/molecules/diamond";

/** Filet dégradé qui s'éteint vers la droite, sous un intitulé aligné à gauche. */
function GoldRule() {
  return <div aria-hidden className="rule-line" />;
}

/** Filet à losange : deux filets qui convergent, sous un titre centré. */
function DiamondRule() {
  return (
    <div className="flex w-full items-center gap-2.5">
      <div aria-hidden className="rule-line-reverse" />
      <Diamond size="tick" tone="filled" />
      <div aria-hidden className="rule-line" />
    </div>
  );
}

export { GoldRule, DiamondRule };
