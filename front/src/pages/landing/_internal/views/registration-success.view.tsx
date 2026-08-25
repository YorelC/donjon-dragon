import { Alert, AlertDescription } from "@/shared/components/atoms/alert";

/** Le compte est créé : plus rien à saisir tant que l'email n'est pas validé. */
export function RegistrationSuccessView() {
  return (
    <div className="mt-[26px] flex flex-col gap-4">
      <Alert className="alert-success">
        <AlertDescription>
          Vérifie ta boîte mail pour activer ton compte.
        </AlertDescription>
      </Alert>
      <p className="fine-print">
        Une fois le compte activé, revenez ici par l'onglet « Se connecter ».
      </p>
    </div>
  );
}
