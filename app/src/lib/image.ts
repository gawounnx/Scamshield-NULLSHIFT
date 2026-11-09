// Shrinks a screenshot to a JPEG with its long side ≤ 1600px (docs/API.md request limits).

const MAX_SIDE = 1600;
const QUALITY = 0.85;

export class UnreadableImageError extends Error {}

export async function screenshotToBase64Jpeg(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new UnreadableImageError("not an image");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UnreadableImageError("cannot decode");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new UnreadableImageError("no canvas");
  context.fillStyle = "#ffffff"; // transparent PNG areas would turn black in JPEG
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
