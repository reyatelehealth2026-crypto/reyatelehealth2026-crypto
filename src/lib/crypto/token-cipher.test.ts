import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken, constantTimeEqual } from "./token-cipher";

describe("token-cipher", () => {
  it("round-trips a token through encrypt/decrypt", () => {
    const plain = "EAAB-super-secret-page-token-12345";
    const cipher = encryptToken(plain);
    expect(cipher).not.toContain(plain);
    expect(decryptToken(cipher)).toBe(plain);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const plain = "same-token";
    expect(encryptToken(plain)).not.toBe(encryptToken(plain));
  });

  it("throws on a malformed payload", () => {
    expect(() => decryptToken("not-a-valid-payload")).toThrow();
  });

  it("throws when the ciphertext is tampered with (GCM auth tag)", () => {
    const cipher = encryptToken("hello");
    const [iv, tag, ct] = cipher.split(".");
    const tampered = [iv, tag, Buffer.from("evil").toString("base64")].join(".");
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("constantTimeEqual compares correctly", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
});
