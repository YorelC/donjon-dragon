import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormState } from "@/shared/types/ui-state";
import {
  SearchFormSchema,
  type SearchFormValues,
} from "../types/friends-schema";
import { useDebouncedValue } from "./use-debounced-value";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * La recherche n'a ni soumission ni état d'erreur global propres : c'est la query
 * qui les porte. On ne retient donc de `FormState` que ce qui a un sens ici.
 */
export interface UserSearch
  extends Pick<FormState<SearchFormValues>, "control" | "errors"> {
  submittedQuery: string;
}

export function useSearchForm(): UserSearch {
  const { control, formState: { errors } } = useForm<SearchFormValues>({
    resolver: zodResolver(SearchFormSchema),
    mode: "onChange",
    defaultValues: { query: "" },
  });
  const rawQuery = useWatch({ control, name: "query" });
  const debouncedQuery = useDebouncedValue(rawQuery, SEARCH_DEBOUNCE_MS);

  return { control, errors, submittedQuery: toSubmittedQuery(debouncedQuery) };
}

function toSubmittedQuery(value: string): string {
  return SearchFormSchema.safeParse({ query: value }).success ? value : "";
}
