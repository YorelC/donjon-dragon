import { Controller } from "react-hook-form";
import type { FieldPath, FieldValues } from "react-hook-form";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import type { FormState } from "@/shared/types/ui-state";

export interface AuthFieldDescriptor<TValues extends FieldValues> {
  name: FieldPath<TValues>;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  /** Mention à droite du libellé, aujourd'hui purement indicative. */
  hint?: string;
}

interface AuthFieldsProps<TValues extends FieldValues> {
  fields: AuthFieldDescriptor<TValues>[];
  form: FormState<TValues>;
}

/** Les champs d'un onglet d'accès, décrits en données plutôt qu'en JSX répété. */
export function AuthFields<TValues extends FieldValues>({
  fields,
  form,
}: AuthFieldsProps<TValues>) {
  return (
    <>
      {fields.map((field) => (
        <AuthField key={field.name} field={field} form={form} />
      ))}
    </>
  );
}

interface AuthFieldProps<TValues extends FieldValues> {
  field: AuthFieldDescriptor<TValues>;
  form: FormState<TValues>;
}

function AuthField<TValues extends FieldValues>({
  field,
  form,
}: AuthFieldProps<TValues>) {
  return (
    <Controller
      name={field.name}
      control={form.control}
      render={({ field: controlled }) => (
        <FormTextInput
          label={field.label}
          field={controlled}
          type={field.type}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          hint={field.hint ? <FieldHint text={field.hint} /> : undefined}
          error={form.errors[field.name]?.message?.toString()}
        />
      )}
    />
  );
}

function FieldHint({ text }: { text: string }) {
  return <span className="text-note text-ink-disabled">{text}</span>;
}
