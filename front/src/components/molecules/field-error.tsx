interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export { FieldError };
