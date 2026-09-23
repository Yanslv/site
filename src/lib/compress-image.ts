const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const START_EDGE = 1600;

function scaledSize(width: number, height: number, edge: number): { width: number; height: number } {
  const scale = Math.min(1, edge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function drawBlob(bitmap: ImageBitmap, edge: number, quality: number, type: "image/webp" | "image/jpeg"): Promise<Blob | null> {
  const size = scaledSize(bitmap.width, bitmap.height, edge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function blobUnderLimit(bitmap: ImageBitmap): Promise<Blob> {
  let edge = START_EDGE;
  let quality = 0.8;
  let blob = await drawBlob(bitmap, edge, quality, "image/webp");

  while (blob && blob.size > MAX_UPLOAD_BYTES && quality > 0.45) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    blob = await drawBlob(bitmap, edge, quality, "image/webp");
  }

  while (blob && blob.size > MAX_UPLOAD_BYTES && edge > 800) {
    edge -= 200;
    blob = await drawBlob(bitmap, edge, quality, "image/webp");
  }

  if (!blob) blob = await drawBlob(bitmap, edge, 0.8, "image/jpeg");
  if (!blob || blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Não foi possível reduzir a imagem para 4 MB.");
  }
  return blob;
}

export async function compressImageFile(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("A imagem original deve ter no máximo 15 MB.");
  if (!file.type.startsWith("image/")) throw new Error("Envie uma imagem JPG, PNG ou WebP.");

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const blob = await blobUnderLimit(bitmap);
    const base = file.name.replace(/\.[^.]+$/, "") || "foto";
    const extension = blob.type === "image/jpeg" ? "jpg" : "webp";
    return new File([blob], `${base}.${extension}`, { type: blob.type });
  } finally {
    bitmap.close();
  }
}
