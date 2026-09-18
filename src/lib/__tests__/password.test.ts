import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("hash de senha (bcrypt)", () => {
  it("nunca armazena a senha em texto puro", async () => {
    const hash = await hashPassword("minha-senha-secreta");
    expect(hash).not.toContain("minha-senha-secreta");
    expect(hash.startsWith("$2")).toBe(true); // formato bcrypt
  });

  it("aceita a senha correta", async () => {
    const hash = await hashPassword("senha-correta-123");
    expect(await verifyPassword("senha-correta-123", hash)).toBe(true);
  });

  it("rejeita uma senha incorreta", async () => {
    const hash = await hashPassword("senha-correta-123");
    expect(await verifyPassword("senha-errada", hash)).toBe(false);
  });
});
