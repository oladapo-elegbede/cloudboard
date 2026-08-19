import { describe, it, expect, vi } from "vitest";

vi.stubEnv("JWT_ACCESS_SECRET", "test_secret_that_is_at_least_32_characters_long");
vi.stubEnv("JWT_ACCESS_EXPIRY", "15m");
vi.stubEnv("JWT_REFRESH_EXPIRY_DAYS", "30");
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("PORT", "3000");
vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3001");

const { generateAccessToken, verifyAccessToken, generateRefreshToken, hashRefreshToken } =
  await import("./token.service.js");

describe("token.service", () => {
  describe("generateAccessToken", () => {
    it("should return a JWT string with three parts", () => {
      const token = generateAccessToken("user-123", "test@example.com");
      const parts = token.split(".");
      expect(parts.length).toBe(3);
    });

    it("should encode the userId as sub claim", () => {
      const token = generateAccessToken("user-456", "alice@example.com");
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      expect(payload.sub).toBe("user-456");
      expect(payload.email).toBe("alice@example.com");
    });

    it("should include iat and exp claims", () => {
      const token = generateAccessToken("user-789", "bob@example.com");
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });
  });

  describe("verifyAccessToken", () => {
    it("should return the payload for a valid token", () => {
      const token = generateAccessToken("user-111", "valid@example.com");
      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe("user-111");
      expect(payload.email).toBe("valid@example.com");
    });

    it("should throw for an invalid token", () => {
      expect(() => verifyAccessToken("invalid.token.here")).toThrow();
    });

    it("should throw for a tampered token", () => {
      const token = generateAccessToken("user-222", "tamper@example.com");
      const tampered = token.slice(0, -5) + "XXXXX";
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe("generateRefreshToken", () => {
    it("should return a token and hash pair", () => {
      const pair = generateRefreshToken();
      expect(pair.token).toBeTruthy();
      expect(pair.hash).toBeTruthy();
      expect(pair.token).not.toBe(pair.hash);
    });

    it("should return a 64-character hex token", () => {
      const pair = generateRefreshToken();
      expect(pair.token.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(pair.token)).toBe(true);
    });

    it("should return a 64-character hex hash", () => {
      const pair = generateRefreshToken();
      expect(pair.hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(pair.hash)).toBe(true);
    });

    it("should produce different tokens each time", () => {
      const pair1 = generateRefreshToken();
      const pair2 = generateRefreshToken();
      expect(pair1.token).not.toBe(pair2.token);
      expect(pair1.hash).not.toBe(pair2.hash);
    });
  });

  describe("hashRefreshToken", () => {
    it("should produce the same hash for the same input", () => {
      const hash1 = hashRefreshToken("abc123");
      const hash2 = hashRefreshToken("abc123");
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = hashRefreshToken("abc123");
      const hash2 = hashRefreshToken("xyz789");
      expect(hash1).not.toBe(hash2);
    });

    it("should match the hash from generateRefreshToken", () => {
      const pair = generateRefreshToken();
      const reHash = hashRefreshToken(pair.token);
      expect(reHash).toBe(pair.hash);
    });
  });
});
