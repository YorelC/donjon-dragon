import { describe, it, expect } from "vitest";
import {
  ReceivedRequestSchema,
  SentRequestSchema,
  SearchFormSchema,
} from "./friends-schema";

const FRIENDSHIP_ID = "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d";

// Ce que le serveur envoie reellement depuis le durcissement du contrat : un
// handle de relation, son statut, et le pseudo de l'autre joueur. Ni email, ni
// identifiant d'utilisateur.
const friendRequest = {
  id: FRIENDSHIP_ID,
  status: "pending",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("friends-schema", () => {
  describe("ReceivedRequestSchema", () => {
    it("should parse a valid received request", () => {
      const valid = { ...friendRequest, requester: { displayName: "TestUser" } };
      expect(ReceivedRequestSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject without requester", () => {
      expect(ReceivedRequestSchema.safeParse(friendRequest).success).toBe(false);
    });

    // Filet de securite : si le serveur regressait et renvoyait a nouveau des
    // identites, le schema les retirerait avant qu'elles n'atteignent le cache.
    it("strips any leaked identity fields", () => {
      const leaky = {
        ...friendRequest,
        requesterId: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
        recipientId: "c3d4e5f6-a7b8-6c7d-1e5f-4a3b2c3d4e5f",
        requester: {
          id: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
          email: "test@example.com",
          displayName: "TestUser",
        },
      };

      const parsed = ReceivedRequestSchema.parse(leaky);

      expect(parsed).not.toHaveProperty("requesterId");
      expect(parsed).not.toHaveProperty("recipientId");
      expect(Object.keys(parsed.requester)).toEqual(["displayName"]);
    });
  });

  describe("SentRequestSchema", () => {
    it("should parse a valid sent request", () => {
      const valid = {
        ...friendRequest,
        recipient: { displayName: "RecipientUser" },
      };
      expect(SentRequestSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject without recipient", () => {
      expect(SentRequestSchema.safeParse(friendRequest).success).toBe(false);
    });
  });

  // Bornes partagees avec la route serveur (UserSearchQuerySchema) : 3 caracteres
  // minimum pour ne pas pouvoir balayer l'annuaire, 25 maximum.
  describe("SearchFormSchema", () => {
    it.each(["abc", "John", "a".repeat(25)])("accepts %s", (query) => {
      expect(SearchFormSchema.safeParse({ query }).success).toBe(true);
    });

    it.each(["", "a", "ab", "a".repeat(26)])("rejects %s", (query) => {
      expect(SearchFormSchema.safeParse({ query }).success).toBe(false);
    });
  });
});
