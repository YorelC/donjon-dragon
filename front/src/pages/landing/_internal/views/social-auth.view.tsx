import { Button } from "@/shared/components/atoms/button";
import { FramedHeading } from "@/shared/components/molecules/section-heading";

const SOCIAL_PROVIDERS = ["Google", "Discord"] as const;

/**
 * Les accès externes sont dessinés mais inactifs : aucun fournisseur OAuth n'est
 * branché côté serveur. Ils restent visibles pour annoncer ce qui vient.
 */
export function SocialAuthView() {
  return (
    <>
      <div className="mt-6 mb-[18px]">
        <FramedHeading label="ou" />
      </div>
      <div className="flex flex-col gap-2.5">
        {SOCIAL_PROVIDERS.map((provider) => (
          <SocialAuthButton key={provider} provider={provider} />
        ))}
      </div>
      <p className="mt-2.5 fine-print">
        Connexions externes bientôt disponibles.
      </p>
    </>
  );
}

function SocialAuthButton({ provider }: { provider: string }) {
  return (
    <Button type="button" variant="outline" disabled>
      Continuer avec {provider}
    </Button>
  );
}
