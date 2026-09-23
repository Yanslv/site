import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { encodeUploadAsWebp } from "../encode-webp";

describe("encodeUploadAsWebp", () => {
  it("converte um PNG largo em WebP com no máximo 1600 px", async () => {
    const png = await sharp({
      create: { width: 2400, height: 1200, channels: 3, background: { r: 180, g: 80, b: 90 } },
    })
      .png()
      .toBuffer();

    const webp = await encodeUploadAsWebp(png);
    const meta = await sharp(webp).metadata();

    expect(webp.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(webp.subarray(8, 12).toString("ascii")).toBe("WEBP");
    expect(webp.length).toBeLessThan(4 * 1024 * 1024);
    expect(meta.width).toBeLessThanOrEqual(1600);
    expect(meta.height).toBeLessThanOrEqual(1600);
  });

  it("rejeita arquivo que não é imagem", async () => {
    await expect(encodeUploadAsWebp(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow(/JPG, PNG ou WebP/);
  });
});
