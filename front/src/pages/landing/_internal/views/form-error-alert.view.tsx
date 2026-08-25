import { Alert, AlertDescription } from "@/shared/components/atoms/alert";

/** Le refus du serveur, au-dessus du bouton qui l'a déclenché. */
export function FormErrorAlert({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Alert className="alert-error">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
