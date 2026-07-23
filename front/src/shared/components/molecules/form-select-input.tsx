import type { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { Label } from "@/shared/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/atoms/select";
import { FieldError } from "@/shared/components/molecules/field-error";

interface FormSelectInputProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  label: string;
  error?: string;
  field: ControllerRenderProps<TFieldValues, TName>;
  options: readonly string[];
  placeholder: string;
}

function FormSelectInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  label,
  error,
  field,
  options,
  placeholder,
}: FormSelectInputProps<TFieldValues, TName>) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Select onValueChange={field.onChange} value={field.value as string}>
        <SelectTrigger className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError message={error} />
    </div>
  );
}

export { FormSelectInput };
