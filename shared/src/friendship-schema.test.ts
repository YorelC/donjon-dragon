import { describe, it, expect } from "vitest";
import {
  FriendshipStatusEnum,
  FriendshipSchema,
  FriendRequestSchema,
  SendFriendRequestSchema,
  UserSearchQuerySchema,
  UserSearchResultSchema,
  DeleteFriendParamsSchema,
  PendingReceivedCountSchema,
} from "./friendship-schema";

describe("friendship-schema", () => {
  describe("FriendshipStatusEnum", () => {
    it("should accept 'pending' status", () => {
      expect(FriendshipStatusEnum.parse("pending")).toBe("pending");
    });

    it("should accept 'accepted' status", () => {
      expect(FriendshipStatusEnum.parse("accepted")).toBe("accepted");
    });

    it("should accept 'refused' status", () => {
      expect(FriendshipStatusEnum.parse("refused")).toBe("refused");
    });

    it("should reject invalid status", () => {
      expect(() => FriendshipStatusEnum.parse("invalid")).toThrow();
    });
  });

  describe("FriendshipSchema", () => {
    it("should parse a valid friendship", () => {
      const valid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      expect(FriendshipSchema.parse(valid)).toEqual(valid);
    });

    it("should reject missing id", () => {
      const invalid = {
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      expect(() => FriendshipSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid id (not UUID)", () => {
      const invalid = {
        id: "not-a-uuid",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      expect(() => FriendshipSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid status", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
    status: "invalid" as const,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      expect(() => FriendshipSchema.parse(invalid)).toThrow();
    });
  });

  describe("SendFriendRequestSchema", () => {
    it("should parse a valid displayName", () => {
      expect(SendFriendRequestSchema.parse({ displayName: "Gandalf" })).toEqual({
        displayName: "Gandalf",
      });
    });

    it("should reject displayName too short (< 2 chars)", () => {
      expect(() => SendFriendRequestSchema.parse({ displayName: "A" })).toThrow();
    });

    it("should reject displayName too long (> 50 chars)", () => {
      const longName = "A".repeat(51);
      expect(() => SendFriendRequestSchema.parse({ displayName: longName })).toThrow();
    });

    it("should reject empty displayName", () => {
      expect(() => SendFriendRequestSchema.parse({ displayName: "" })).toThrow();
    });

    it("should reject missing displayName", () => {
      expect(() => SendFriendRequestSchema.parse({} as const)).toThrow();
    });
  });

  // Source unique des bornes de recherche, partagée par la route serveur et le
  // formulaire front. Le minimum à 3 empêche de balayer l'annuaire lettre par
  // lettre ; le maximum à 25 borne le coût du $regex.
  describe("UserSearchQuerySchema", () => {
    it.each(["Gan", "Gandalf", "A".repeat(25)])("accepte %s", (q) => {
      expect(UserSearchQuerySchema.parse({ q })).toEqual({ q, page: 1 });
    });

    it.each(["", "A", "Ga", "A".repeat(26)])("rejette %s", (q) => {
      expect(() => UserSearchQuerySchema.parse({ q })).toThrow();
    });

    it("retire les espaces de bord", () => {
      expect(UserSearchQuerySchema.parse({ q: "  Gan  " })).toEqual({ q: "Gan", page: 1 });
    });

    it("rejette une requête qui devient trop courte après trim", () => {
      expect(() => UserSearchQuerySchema.parse({ q: "  Ga  " })).toThrow();
    });

    it("prend page=1 par défaut si absent", () => {
      expect(UserSearchQuerySchema.parse({ q: "Gan" }).page).toBe(1);
    });

    it("coerce page depuis une string de query HTTP", () => {
      expect(UserSearchQuerySchema.parse({ q: "Gan", page: "2" }).page).toBe(2);
    });

    it.each([0, -1, 1.5])("rejette page invalide : %s", (page) => {
      expect(() => UserSearchQuerySchema.parse({ q: "Gan", page })).toThrow();
    });
  });

  describe("UserSearchResultSchema", () => {
    it("parse une page de résultats", () => {
      const valid = { items: [{ displayName: "Gandalf" }], hasMore: true };
      expect(UserSearchResultSchema.parse(valid)).toEqual(valid);
    });

    it("parse une page vide sans page suivante", () => {
      const valid = { items: [], hasMore: false };
      expect(UserSearchResultSchema.parse(valid)).toEqual(valid);
    });

    it("rejette un item sans displayName", () => {
      expect(() =>
        UserSearchResultSchema.parse({ items: [{}], hasMore: false }),
      ).toThrow();
    });
  });

  // Ce que le CLIENT reçoit d'une relation : le handle et le statut, jamais les
  // identifiants des deux parties.
  describe("FriendRequestSchema", () => {
    const valid = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "pending",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    it("parse une demande sans identifiants d'utilisateur", () => {
      expect(FriendRequestSchema.parse(valid)).toEqual(valid);
    });

    it("retire requesterId et recipientId s'ils sont présents", () => {
      const parsed = FriendRequestSchema.parse({
        ...valid,
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
      });

      expect(parsed).toEqual(valid);
    });
  });

  describe("DeleteFriendParamsSchema", () => {
    it("should parse a valid friendshipId", () => {
      expect(DeleteFriendParamsSchema.parse({ friendshipId: "550e8400-e29b-41d4-a716-446655440000" })).toEqual({
        friendshipId: "550e8400-e29b-41d4-a716-446655440000",
      });
    });

    it("should reject invalid friendshipId (not UUID)", () => {
      expect(() => DeleteFriendParamsSchema.parse({ friendshipId: "not-a-uuid" })).toThrow();
    });

    it.each([
      { id: "12345", reason: "chiffres seuls" },
      { id: "", reason: "vide" },
      { id: "550e8400-e29b-41d4-a716-44665544000Z", reason: "UUID avec caractere invalide (Z)" },
      { id: "  550e8400-e29b-41d4-a716-446655440000  ", reason: "UUID avec espaces" },
    ])("rejette $reason : $id", ({ id }) => {
      expect(() => DeleteFriendParamsSchema.parse({ friendshipId: id })).toThrow();
    });

    it("should reject missing friendshipId", () => {
      expect(() => DeleteFriendParamsSchema.parse({} as const)).toThrow();
    });

    it("should reject null", () => {
      expect(() => DeleteFriendParamsSchema.parse(null)).toThrow();
    });

    it("should reject undefined", () => {
      expect(() => DeleteFriendParamsSchema.parse(undefined)).toThrow();
    });
  });

  describe("PendingReceivedCountSchema", () => {
    it("should parse count = 0", () => {
      expect(PendingReceivedCountSchema.parse({ count: 0 })).toEqual({ count: 0 });
    });

    it("should parse count > 0", () => {
      expect(PendingReceivedCountSchema.parse({ count: 5 })).toEqual({ count: 5 });
    });

    it("should reject negative count", () => {
      expect(() => PendingReceivedCountSchema.parse({ count: -1 })).toThrow();
    });

    it("should reject float count", () => {
      expect(() => PendingReceivedCountSchema.parse({ count: 1.5 })).toThrow();
    });

    it("should reject missing count", () => {
      expect(() => PendingReceivedCountSchema.parse({} as const)).toThrow();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// INV-001 [UA-008] : PendingReceivedCountSchema testé ici (count >= 0, integer).
// INV-002 [UA-003] : DeleteFriendParamsSchema testé ici (friendshipId UUID).
//
// Les UA elles-mêmes (modale, badge, optimistique, etc.) ne sont pas couvertes
// ici car elles concernent la logique métier et l'interface utilisateur, pas
// seulement la validation des données.
