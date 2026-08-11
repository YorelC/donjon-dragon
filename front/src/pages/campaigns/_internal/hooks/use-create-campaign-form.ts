import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCampaignSchema, type CreateCampaignDto } from "@donjon-dragon/shared";
import type { FormState } from "@/shared/types/ui-state";
import { useCreateCampaign } from "../queries/use-create-campaign";

export interface CreateCampaignFormState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState<CreateCampaignDto>;
}

const EMPTY_CREATE_CAMPAIGN_FORM: CreateCampaignDto = { name: "" };

export function useCreateCampaignForm(): CreateCampaignFormState {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateCampaignDto>({
    resolver: zodResolver(CreateCampaignSchema),
    defaultValues: EMPTY_CREATE_CAMPAIGN_FORM,
  });
  const { submit, isPending } = useCreateCampaignSubmit(() => {
    form.reset();
    setOpen(false);
  });

  return { open, onOpenChange: setOpen, form: toFormState(form, submit, isPending) };
}

/**
 * `mutate` et non `mutateAsync` : l'échec est déjà traité par le toast de la
 * mutation, et une promesse rejetée traverserait `handleSubmit` sans personne
 * pour l'attraper.
 */
function useCreateCampaignSubmit(onCreated: () => void) {
  const createCampaign = useCreateCampaign();
  const submit = (values: CreateCampaignDto) =>
    createCampaign.mutate(values.name, { onSuccess: onCreated });

  return { submit, isPending: createCampaign.isPending };
}

function toFormState(
  form: UseFormReturn<CreateCampaignDto>,
  onSubmit: (values: CreateCampaignDto) => void,
  isPending: boolean,
): FormState<CreateCampaignDto> {
  return {
    control: form.control,
    errors: form.formState.errors,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting || isPending,
  };
}
