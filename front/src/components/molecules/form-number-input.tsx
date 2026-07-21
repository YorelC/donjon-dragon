import type { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { FieldError } from "@/components/molecules/field-error";

interface FormNumberInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  label: string;
  error?: string;
  field: ControllerRenderProps<TFieldValues, TName>;
}

function FormNumberInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  label,
  error,
  field,
}: FormNumberInputProps<TFieldValues, TName>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        type="number"
        name={field.name}
        ref={field.ref}
        onBlur={field.onBlur}
        value={field.value as number}
        aria-invalid={!!error}
        onChange={(event) => field.onChange(Number(event.target.value))}
      />
      <FieldError message={error} />
    </div>
  );
}

export { FormNumberInput };
