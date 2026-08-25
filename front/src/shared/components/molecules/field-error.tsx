interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="text-note text-destructive">{message}</p>;
}

export { FieldError };
