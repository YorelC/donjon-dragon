import type { ReactNode } from "react";
import type { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import { FieldError } from "@/shared/components/molecules/field-error";
import { PasswordInput } from "@/shared/components/molecules/password-input";

const PASSWORD_TYPE = "password";

interface FormTextInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  label: string;
  error?: string;
  type?: string;
  placeholder?: string;
  /** Valeur `autocomplete` : sans elle, Chrome propose ses adresses postales. */
  autoComplete?: string;
  /** Mention alignée à droite du libellé : « Oublié ? », « facultatif ». */
  hint?: ReactNode;
  field: ControllerRenderProps<TFieldValues, TName>;
}

function FormTextInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: FormTextInputProps<TFieldValues, TName>,
) {
  const { label, error, hint, field } = props;

  return (
    <div className="grid gap-[7px]">
      <LabelRow label={label} hint={hint} name={field.name} />
      <FieldInput {...props} />
      <FieldError message={error} />
    </div>
  );
}

interface LabelRowProps {
  label: string;
  hint?: ReactNode;
  name: string;
}

function LabelRow({ label, hint, name }: LabelRowProps) {
  if (!hint) return <Label htmlFor={name}>{label}</Label>;

  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label htmlFor={name}>{label}</Label>
      {hint}
    </div>
  );
}

/** Un mot de passe se dévoile ; tout autre gabarit est un champ nu. */
function FieldInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  error,
  type = "text",
  placeholder,
  autoComplete,
  field,
}: FormTextInputProps<TFieldValues, TName>) {
  const Field = type === PASSWORD_TYPE ? PasswordInput : Input;

  return (
    <Field
      id={field.name}
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-invalid={!!error}
      {...field}
    />
  );
}

export { FormTextInput };
