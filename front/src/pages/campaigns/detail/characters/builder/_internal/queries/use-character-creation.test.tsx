import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  Character,
  CreateCharacterDto,
  IssuedAbilityRoll,
} from "@donjon-dragon/shared";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/api/api", () => ({
  api: { post: vi.fn() },
}));

import { api } from "@/shared/api/api";
import { IDEMPOTENCY_KEY_HEADER } from "@donjon-dragon/shared";
import { useCreateCharacter, useRollAbilities } from "./use-character-creation";

const CAMPAIGN_ID = "3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8";
const ROLL_ID = "9f2c6d18-4b7a-4f31-8e05-7c1a3d6b2e40";
// La mutation ne fait que transmettre : ce test n'éprouve pas la composition,
// seulement la route, l'en-tête de commande et le corps transmis tel quel.
const PAYLOAD = {
  name: "Frodo Sacquet",
  abilityRollId: ROLL_ID,
} as CreateCharacterDto;
const ISSUED: IssuedAbilityRoll = {
  rollId: ROLL_ID,
  dice: [[6, 5, 4, 1]],
  totals: [15],
};
const CREATED = { id: "660e8400-e29b-41d4-a716-446655440001" } as Character;

function renderRollMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return renderHook(() => useRollAbilities(CAMPAIGN_ID), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

function renderMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return renderHook(() => useCreateCharacter(CAMPAIGN_ID), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useCreateCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Le serveur exige la clé : sans elle la création part en 400.
  it("poste la composition avec une clé d'idempotence", async () => {
    vi.mocked(api.post).mockResolvedValue(CREATED);
    const { result } = renderMutation();

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/characters`,
      PAYLOAD,
      { [IDEMPOTENCY_KEY_HEADER]: expect.any(String) },
    );
  });

  // Le navigateur ne lance plus rien : il ne transmet que l'identité du tirage.
  it("n'envoie aucun dé, seulement la référence du tirage", async () => {
    vi.mocked(api.post).mockResolvedValue(CREATED);
    const { result } = renderMutation();

    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [, body] = vi.mocked(api.post).mock.calls[0] ?? [];
    expect(body).toMatchObject({ abilityRollId: ROLL_ID });
    expect(body).not.toHaveProperty("abilityRoll");
  });
});

describe("useRollAbilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("demande le tirage au serveur, avec une clé d'idempotence", async () => {
    vi.mocked(api.post).mockResolvedValue(ISSUED);
    const { result } = renderRollMutation();

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith(
      `/api/campaigns/${CAMPAIGN_ID}/characters/ability-roll`,
      undefined,
      { [IDEMPOTENCY_KEY_HEADER]: expect.any(String) },
    );
    expect(result.current.data).toEqual(ISSUED);
  });
});
