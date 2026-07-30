import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { PublicUser } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent } from "@/shared/components/atoms/card";
import type { SearchFormValues } from "../types/friends-schema";
import { FormTextInput } from "@/shared/components/molecules/form-text-input";

interface SearchUsersViewProps {
  data: PublicUser[];
  loading: boolean;
  error: boolean;
  searchControl: Control<SearchFormValues>;
  searchErrors: FieldErrors<SearchFormValues>;
  onSearchSubmit: (e: React.FormEvent) => void;
  submittedQuery: string;
  onSendRequest: (displayName: string) => void;
  pendingRecipientIds: Set<string>;
  sendMutationPending: boolean;
}

export function SearchUsersView({
  data,
  loading,
  error,
  searchControl,
  searchErrors,
  onSearchSubmit,
  submittedQuery,
  onSendRequest,
  pendingRecipientIds,
  sendMutationPending,
}: SearchUsersViewProps) {
  return (
    <div className="space-y-6">
      <SearchForm
        control={searchControl}
        errors={searchErrors}
        onSubmit={onSearchSubmit}
      />
      {submittedQuery && (
        <SearchResults
          data={data}
          loading={loading}
          error={error}
          onSendRequest={onSendRequest}
          pendingRecipientIds={pendingRecipientIds}
          sendMutationPending={sendMutationPending}
        />
      )}
    </div>
  );
}

interface SearchFormProps {
  control: Control<SearchFormValues>;
  errors: FieldErrors<SearchFormValues>;
  onSubmit: (e: React.FormEvent) => void;
}

function SearchForm({ control, errors, onSubmit }: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <div className="flex-1">
        <Controller
          name="query"
          control={control}
          render={({ field }) => (
            <FormTextInput
              label="Rechercher un joueur"
              field={field}
              error={errors.query?.message}
            />
          )}
        />
      </div>
      <Button type="submit" className="self-end">
        Chercher
      </Button>
    </form>
  );
}

interface SearchResultsProps {
  data: PublicUser[];
  loading: boolean;
  error: boolean;
  onSendRequest: (displayName: string) => void;
  pendingRecipientIds: Set<string>;
  sendMutationPending: boolean;
}

function SearchResults({
  data,
  loading,
  error,
  onSendRequest,
  pendingRecipientIds,
  sendMutationPending,
}: SearchResultsProps) {
  if (loading) return <div className="empty-state-text">Chargement...</div>;
  if (error) return <div className="empty-state-text">Erreur lors de la recherche.</div>;
  if (data.length === 0) {
    return <div className="empty-state-text">Aucun résultat trouvé.</div>;
  }

  return (
    <div className="space-y-2">
      {data.map((user) => {
        const alreadyInvited = pendingRecipientIds.has(user.id);
        return (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-4">
              <span className="font-medium">{user.displayName}</span>
              <Button
                onClick={() => onSendRequest(user.displayName)}
                disabled={sendMutationPending || alreadyInvited}
                size="sm"
              >
                {alreadyInvited
                  ? "Invitation envoyée"
                  : sendMutationPending
                    ? "Envoi..."
                    : "Envoyer"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
