import { describe, it, expect } from "vitest";
import {
  ReceivedRequestSchema,
  SentRequestSchema,
  AcceptedFriendSchema,
  SearchFormSchema,
} from "./friends-schema";

describe("friends-schema", () => {
  describe("ReceivedRequestSchema", () => {
    it("should parse a valid received request", () => {
      const valid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        requester: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "gandalf@example.com",
          displayName: "Gandalf",
          createdAt: "2025-01-01T00:00:00Z",
          emailVerified: true,
        },
      };

      expect(ReceivedRequestSchema.parse(valid)).toEqual(valid);
    });

    it("should reject missing requester field", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      expect(() => ReceivedRequestSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid status", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "invalid",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        requester: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "gandalf@example.com",
          displayName: "Gandalf",
          createdAt: "2025-01-01T00:00:00Z",
          emailVerified: true,
        },
      };

      expect(() => ReceivedRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("SentRequestSchema", () => {
    it("should parse a valid sent request", () => {
      const valid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        recipient: {
          id: "550e8400-e29b-41d4-a716-446655440002",
          email: "frodon@example.com",
          displayName: "Frodon",
          createdAt: "2025-01-01T00:00:00Z",
          emailVerified: true,
        },
      };

      expect(SentRequestSchema.parse(valid)).toEqual(valid);
    });

    it("should reject missing recipient field", () => {
      const invalid = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        requesterId: "550e8400-e29b-41d4-a716-446655440001",
        recipientId: "550e8400-e29b-41d4-a716-446655440002",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      expect(() => SentRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("AcceptedFriendSchema", () => {
    it("should parse a valid accepted friend", () => {
      const valid = {
        friendshipId: "550e8400-e29b-41d4-a716-446655440000",
        friend: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "gandalf@example.com",
          displayName: "Gandalf",
          createdAt: "2025-01-01T00:00:00Z",
          emailVerified: true,
        },
      };

      expect(AcceptedFriendSchema.parse(valid)).toEqual(valid);
    });

    it("should reject missing friendshipId", () => {
      const invalid = {
        friend: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "gandalf@example.com",
          displayName: "Gandalf",
          createdAt: "2025-01-01T00:00:00Z",
          emailVerified: true,
        },
      };

      expect(() => AcceptedFriendSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid friendshipId (not UUID)", () => {
      const invalid = {
        friendshipId: "not-a-uuid",
        friend: {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "gandalf@example.com",
          displayName: "Gandalf",
          createdAt: "2025-01-01T00:00:00Z",
          emailVerified: true,
        },
      };

      expect(() => AcceptedFriendSchema.parse(invalid)).toThrow();
    });
  });

  describe("SearchFormSchema", () => {
    it("should parse a valid search query", () => {
      expect(SearchFormSchema.parse({ query: "Gandalf" })).toEqual({
        query: "Gandalf",
      });
    });

    it("should reject query too short (< 2 chars)", () => {
      expect(() => SearchFormSchema.parse({ query: "A" })).toThrow();
    });

    it("should reject query too long (> 50 chars)", () => {
      const longQuery = "A".repeat(51);
      expect(() => SearchFormSchema.parse({ query: longQuery })).toThrow();
    });

    it("should reject empty query", () => {
      expect(() => SearchFormSchema.parse({ query: "" })).toThrow();
    });
  });
});

// ── Matrice de couverture UA ─────────────────────────────────────────────────
// Aucune UA couverte directement ici : ces schémas valident les données mais
// ne couvrent pas la logique métier (modale, badge, etc.).
// INV-001 (PendingReceivedCountSchema) est couvert dans shared/friendship-schema.test.ts.
