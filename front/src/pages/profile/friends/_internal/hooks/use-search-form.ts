import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SearchFormSchema,
  type SearchFormValues,
} from "../types/friends-schema";

export function useSearchForm() {
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
