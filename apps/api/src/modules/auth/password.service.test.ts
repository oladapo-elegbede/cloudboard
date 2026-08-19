import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.service.js";

describe("password.service", () => {
  describe("hashPassword", () => {
    it("should return a bcrypt hash string", async () => {
      const hash = await hashPassword("MySecurePass123");
      expect(hash).toBeTruthy();
      expect(hash).not.toBe("MySecurePass123");
      expect(hash.startsWith("$2b$12$")).toBe(true);
    });

    it("should produce different hashes for the same password", async () => {
      const hash1 = await hashPassword("SamePassword");
      const hash2 = await hashPassword("SamePassword");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for a matching password", async () => {
      const hash = await hashPassword("CorrectPassword");
      const result = await verifyPassword("CorrectPassword", hash);
      expect(result).toBe(true);
    });

    it("should return false for a non-matching password", async () => {
      const hash = await hashPassword("CorrectPassword");
      const result = await verifyPassword("WrongPassword", hash);
      expect(result).toBe(false);
    });

    it("should return false for an empty password", async () => {
      const hash = await hashPassword("SomePassword");
      const result = await verifyPassword("", hash);
      expect(result).toBe(false);
    });
  });
});
