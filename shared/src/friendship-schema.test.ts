import { describe, it, expect } from "vitest";
import {
  FriendshipStatusEnum,
  FriendshipSchema,
  SendFriendRequestSchema,
  SearchUsersSchema,
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

  describe("SearchUsersSchema", () => {
    it("should parse a valid query", () => {
      expect(SearchUsersSchema.parse({ query: "Gandalf" })).toEqual({
        query: "Gandalf",
      });
    });

    it("should reject query too short (< 1 char)", () => {
      expect(() => SearchUsersSchema.parse({ query: "" })).toThrow();
    });

    it("should reject query too long (> 50 chars)", () => {
      const longQuery = "A".repeat(51);
      expect(() => SearchUsersSchema.parse({ query: longQuery })).toThrow();
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

    it("should reject missing friendshipId", () => {
      expect(() => DeleteFriendParamsSchema.parse({} as const)).toThrow();
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
