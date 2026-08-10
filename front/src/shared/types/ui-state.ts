import type { Control, FieldErrors, FieldValues } from "react-hook-form";

/**
 * L'état d'une query TanStack tel qu'une view a besoin de le lire. Il voyage en
 * un seul objet : les trois champs n'ont de sens qu'ensemble, et les séparer
 * gonflait la signature de toutes les views de liste.
 */
export interface QueryState<T> {
  data: T;
  loading: boolean;
  error: boolean;
}

/** La grappe react-hook-form qu'une view de formulaire reçoit de son hook. */
export interface FormState<TValues extends FieldValues> {
  control: Control<TValues>;
  errors: FieldErrors<TValues>;
  onSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}
