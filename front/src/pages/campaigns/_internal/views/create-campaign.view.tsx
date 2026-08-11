import { Controller } from "react-hook-form";
import type { CreateCampaignDto } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/atoms/dialog";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";
import type { FormState } from "@/shared/types/ui-state";

interface CreateCampaignViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState<CreateCampaignDto>;
}

export function CreateCampaignView({
  open,
  onOpenChange,
  form,
}: CreateCampaignViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Créer une campagne</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle campagne</DialogTitle>
          <DialogDescription>
            Donne-lui un nom. Tu en seras le maître du jeu, et tu pourras y
            inviter tes amis.
          </DialogDescription>
        </DialogHeader>
        <CreateCampaignForm form={form} />
      </DialogContent>
    </Dialog>
  );
}

function CreateCampaignForm({ form }: { form: FormState<CreateCampaignDto> }) {
  return (
    <form onSubmit={form.onSubmit} className="grid gap-4">
      <Controller
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormTextInput
            label="Nom de la campagne"
            error={form.errors.name?.message}
            field={field}
          />
        )}
      />
      <DialogFooter>
        <Button type="submit" disabled={form.isSubmitting}>
          {form.isSubmitting ? "Création..." : "Créer"}
        </Button>
      </DialogFooter>
    </form>
  );
}
