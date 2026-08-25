import { describe, expect, it } from "vitest";
import { RegisterFormSchema } from "./register-form-schema";

const validDto = {
  email: "aragorn@gondor.test",
  displayName: "Aragorn",
  password: "strider123",
  confirmPassword: "strider123",
};

describe("RegisterFormSchema", () => {
  it("accepts a valid registration form", () => {
    const result = RegisterFormSchema.safeParse(validDto);
    expect(result.success).toBe(true);
  });

  it("rejects when confirmPassword does not match password", () => {
    const result = RegisterFormSchema.safeParse({
      ...validDto,
      confirmPassword: "somethingElse",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});
