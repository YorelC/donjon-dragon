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
        id: "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d",
        requesterId: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
        recipientId: "c3d4e5f6-a7b8-6c7d-1e5f-4a3b2c3d4e5f",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        requester: {
          id: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
          email: "test@example.com",
          displayName: "TestUser",
          emailVerified: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      };
      expect(ReceivedRequestSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject without requester", () => {
      const invalid = {
        id: "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d",
        requesterId: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
        recipientId: "c3d4e5f6-a7b8-6c7d-1e5f-4a3b2c3d4e5f",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };
      expect(ReceivedRequestSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("SentRequestSchema", () => {
    it("should parse a valid sent request", () => {
      const valid = {
        id: "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d",
        requesterId: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
        recipientId: "c3d4e5f6-a7b8-6c7d-1e5f-4a3b2c3d4e5f",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        recipient: {
          id: "c3d4e5f6-a7b8-6c7d-1e5f-4a3b2c3d4e5f",
          email: "recipient@example.com",
          displayName: "RecipientUser",
          emailVerified: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      };
      expect(SentRequestSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject without recipient", () => {
      const invalid = {
        id: "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d",
        requesterId: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
        recipientId: "c3d4e5f6-a7b8-6c7d-1e5f-4a3b2c3d4e5f",
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };
      expect(SentRequestSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("AcceptedFriendSchema", () => {
    it("should parse a valid accepted friend", () => {
      const valid = {
        friendshipId: "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d",
        friend: {
          id: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
          email: "friend@example.com",
          displayName: "FriendUser",
          emailVerified: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      };
      expect(AcceptedFriendSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject without friend", () => {
      const invalid = {
        friendshipId: "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d",
      };
      expect(AcceptedFriendSchema.safeParse(invalid).success).toBe(false);
    });

    it("should reject without friendshipId", () => {
      const invalid = {
        friend: {
          id: "b2c3d4e5-f6a7-5b6c-0d4e-3f2a1b2c3d4e",
          email: "friend@example.com",
          displayName: "FriendUser",
          emailVerified: true,
          createdAt: "2024-01-01T00:00:00Z",
        },
      };
      expect(AcceptedFriendSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("SearchFormSchema", () => {
    it("should parse a valid search query", () => {
      expect(SearchFormSchema.safeParse({ query: "ab" }).success).toBe(true);
      expect(SearchFormSchema.safeParse({ query: "John" }).success).toBe(true);
    });

    it("should reject query too short", () => {
      expect(SearchFormSchema.safeParse({ query: "a" }).success).toBe(false);
    });

    it("should reject query too long", () => {
      const longQuery = "a".repeat(51);
      expect(SearchFormSchema.safeParse({ query: longQuery }).success).toBe(
        false
      );
    });
  });
});
