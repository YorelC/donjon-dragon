import { describe, it, expect } from "vitest";
import { AcceptedFriendSchema } from "./friend";

const FRIENDSHIP_ID = "a1b2c3d4-e5f6-4a5b-9c3d-2e1f0a1b2c3d";

describe("AcceptedFriendSchema", () => {
  it("should parse a valid accepted friend", () => {
    const valid = {
      friendshipId: FRIENDSHIP_ID,
      friend: { displayName: "FriendUser" },
    };
    expect(AcceptedFriendSchema.safeParse(valid).success).toBe(true);
  });

  it("should reject without friend", () => {
    expect(
      AcceptedFriendSchema.safeParse({ friendshipId: FRIENDSHIP_ID }).success,
    ).toBe(false);
  });

  it("should reject without friendshipId", () => {
    expect(
      AcceptedFriendSchema.safeParse({ friend: { displayName: "FriendUser" } })
        .success,
    ).toBe(false);
  });
});
