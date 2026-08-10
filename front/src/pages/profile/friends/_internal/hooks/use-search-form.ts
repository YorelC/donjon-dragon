import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormState } from "@/shared/types/ui-state";
import {
  SearchFormSchema,
  type SearchFormValues,
} from "../types/friends-schema";

/**
 * La recherche n'a ni état de soumission ni message d'erreur propres : c'est la
 * query qui les porte. On ne retient donc de `FormState` que ce qui a un sens ici.
 */
export interface UserSearch
  extends Pick<FormState<SearchFormValues>, "control" | "errors" | "onSubmit"> {
  submittedQuery: string;
}

export function useSearchForm(): UserSearch {
  const [submittedQuery, setSubmittedQuery] = useState<string>("");
  const { control, handleSubmit, formState: { errors } } = useForm<
    SearchFormValues
  >({
    resolver: zodResolver(SearchFormSchema),
    defaultValues: { query: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmittedQuery(values.query);
  });

  return {
    control,
    errors,
    onSubmit,
    submittedQuery,
  };
}
