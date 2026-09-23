import sharp from "sharp";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 1600;

function isAllowedImage(bytes: Uint8Array): boolean {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp =
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  return jpeg || png || webp;
}

async function renderWebp(input: Uint8Array, edge: number, quality: number): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

export async function encodeUploadAsWebp(input: Uint8Array): Promise<Buffer> {
  if (!isAllowedImage(input)) throw new Error("Envie uma imagem JPG, PNG ou WebP.");

  let quality = 80;
  let edge = MAX_EDGE;
  let output = await renderWebp(input, edge, quality);

  while (output.length > MAX_BYTES && quality > 40) {
    quality -= 10;
    output = await renderWebp(input, edge, quality);
  }

  while (output.length > MAX_BYTES && edge > 800) {
    edge -= 200;
    output = await renderWebp(input, edge, quality);
  }

  if (output.length > MAX_BYTES) throw new Error("Não foi possível reduzir a imagem para 4 MB.");
  return output;
}
