import { describe, expect, it } from "vitest";
import {
  centsToBrlInput,
  isCanonicalWhatsapp,
  maskBrlFromDigits,
  maskSlug,
  maskWhatsapp,
  parseBrlToCents,
  whatsappToCanonical,
} from "../masks";

describe("máscara de WhatsApp", () => {
  it("formata celular com DDD", () => {
    expect(maskWhatsapp("65999990000")).toBe("(65) 99999-0000");
  });

  it("aceita número já com DDI 55", () => {
    expect(maskWhatsapp("+55 65 99999-0000")).toBe("(65) 99999-0000");
    expect(whatsappToCanonical("(65) 99999-0000")).toBe("5565999990000");
    expect(isCanonicalWhatsapp("5565999990000")).toBe(true);
  });

  it("rejeita número sem DDD completo", () => {
    expect(isCanonicalWhatsapp(whatsappToCanonical("999990000"))).toBe(false);
  });
});

describe("máscara de preço", () => {
  it("trata os dígitos como centavos", () => {
    expect(maskBrlFromDigits("65000")).toBe("650,00");
    expect(parseBrlToCents("650,00")).toBe(65000);
    expect(centsToBrlInput(9000)).toBe("90,00");
  });

  it("agrupa milhar", () => {
    expect(maskBrlFromDigits("123456")).toBe("1.234,56");
    expect(parseBrlToCents("1.234,56")).toBe(123456);
  });
});

describe("máscara de slug", () => {
  it("deixa minúsculo e troca espaço por hífen", () => {
    expect(maskSlug("Nano Fios")).toBe("nano-fios");
    expect(maskSlug("Micropigmentação Labial")).toBe("micropigmentacao-labial");
  });
});
