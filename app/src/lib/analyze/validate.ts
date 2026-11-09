import { IMAGE_MIME_TYPES, type AnalyzeErrorCode, type AnalyzeRequest, type ImageMimeType } from "./types";

export const MAX_TEXT_CHARS = 5_000;
// ~3MB decoded. Keeps the whole JSON body under Vercel's 4.5MB request limit.
export const MAX_IMAGE_BASE64_CHARS = 4_000_000;

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export type ValidationResult =
  | { ok: true; request: AnalyzeRequest }
  | { ok: false; code: Extract<AnalyzeErrorCode, "INVALID_INPUT" | "PAYLOAD_TOO_LARGE">; message: string };

const invalid = (message: string): ValidationResult => ({ ok: false, code: "INVALID_INPUT", message });
const tooLarge = (message: string): ValidationResult => ({ ok: false, code: "PAYLOAD_TOO_LARGE", message });

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidLocale(locale: string): boolean {
  try {
    return Intl.getCanonicalLocales(locale).length === 1;
  } catch {
    return false;
  }
}

export function validateAnalyzeRequest(body: unknown): ValidationResult {
  if (!isObject(body)) return invalid("Request body must be a JSON object.");

  const { text, image, locale } = body;

  if (typeof locale !== "string" || !isValidLocale(locale)) {
    return invalid("locale is required and must be a BCP 47 language tag, e.g. \"ko-KR\".");
  }

  let parsedText: string | undefined;
  if (text !== undefined && text !== null) {
    if (typeof text !== "string") return invalid("text must be a string.");
    const trimmed = text.trim();
    // Code points never exceed UTF-16 length, so only count them near the limit.
    if (trimmed.length > MAX_TEXT_CHARS * 2 || (trimmed.length > MAX_TEXT_CHARS && [...trimmed].length > MAX_TEXT_CHARS)) {
      return tooLarge(`text exceeds ${MAX_TEXT_CHARS} characters.`);
    }
    if (trimmed !== "") parsedText = trimmed;
  }

  let parsedImage: AnalyzeRequest["image"];
  if (image !== undefined && image !== null) {
    if (!isObject(image)) return invalid("image must be an object with mimeType and data.");
    const { mimeType, data } = image;
    if (typeof mimeType !== "string" || !(IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return invalid(`image.mimeType must be one of: ${IMAGE_MIME_TYPES.join(", ")}.`);
    }
    if (typeof data !== "string" || data === "") return invalid("image.data must be a non-empty base64 string.");
    if (data.startsWith("data:")) return invalid("image.data must not include a \"data:\" prefix.");
    if (data.length > MAX_IMAGE_BASE64_CHARS) {
      return tooLarge(`image.data exceeds ${MAX_IMAGE_BASE64_CHARS} base64 characters.`);
    }
    if (data.length % 4 !== 0 || !BASE64_PATTERN.test(data)) return invalid("image.data is not valid base64.");
    parsedImage = { mimeType: mimeType as ImageMimeType, data };
  }

  if (parsedText === undefined && parsedImage === undefined) {
    return invalid("Provide text or image (or both).");
  }

  return {
    ok: true,
    request: {
      locale,
      ...(parsedText !== undefined && { text: parsedText }),
      ...(parsedImage !== undefined && { image: parsedImage }),
    },
  };
}
