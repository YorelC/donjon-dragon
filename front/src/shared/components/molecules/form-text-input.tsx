import type { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import { FieldError } from "@/shared/components/molecules/field-error";

interface FormTextInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  label: string;
  error?: string;
  type?: string;
  field: ControllerRenderProps<TFieldValues, TName>;
}

function FormTextInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  label,
  error,
  type = "text",
  field,
}: FormTextInputProps<TFieldValues, TName>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.name}>{label}</Label>
      <Input id={field.name} type={type} aria-invalid={!!error} {...field} />
      <FieldError message={error} />
    </div>
  );
}

export { FormTextInput };
