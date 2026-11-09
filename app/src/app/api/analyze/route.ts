import { analyzeWithGemini, BusyError } from "@/lib/analyze/gemini";
import { isDemoSample, pickMockVerdict } from "@/lib/analyze/mocks";
import { enforceVerdictRules } from "@/lib/analyze/postprocess";
import type { AnalyzeError, AnalyzeErrorCode, Verdict } from "@/lib/analyze/types";
import { validateAnalyzeRequest } from "@/lib/analyze/validate";

// Gemini retries + fallback can take a while; give the function room on Vercel.
export const maxDuration = 30;

// Vercel's request body limit. Reject early instead of buffering a larger body.
const MAX_BODY_BYTES = 4_500_000;

const STATUS: Record<AnalyzeErrorCode, number> = {
  INVALID_INPUT: 400,
  PAYLOAD_TOO_LARGE: 413,
  BUSY: 503,
  INTERNAL: 500,
};

function errorResponse(code: AnalyzeErrorCode, message: string, retryAfterSec?: number): Response {
  const body: AnalyzeError = { error: { code, message, ...(retryAfterSec ? { retryAfterSec } : {}) } };
  return Response.json(body, { status: STATUS[code] });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const mediaType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (mediaType !== "application/json") {
      return errorResponse("INVALID_INPUT", "Content-Type must be application/json.");
    }
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      return errorResponse("PAYLOAD_TOO_LARGE", `Request body exceeds ${MAX_BODY_BYTES} bytes.`);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Request body is not valid JSON.");
    }

    const result = validateAnalyzeRequest(body);
    if (!result.ok) return errorResponse(result.code, result.message);

    const req = result.request;
    let raw: Verdict;
    if (!process.env.GEMINI_API_KEY) {
      // No key (local UI work, tests): mock verdicts from docs/API.md.
      raw = pickMockVerdict(req);
    } else {
      try {
        raw = await analyzeWithGemini(req);
      } catch (error) {
        if (!(error instanceof BusyError)) throw error;
        // Demo safety net (SPEC Risks): demo samples keep their cached verdict; set
        // ANALYZE_MOCK_ON_BUSY=1 to answer every request with mocks while recording.
        if (!isDemoSample(req) && process.env.ANALYZE_MOCK_ON_BUSY !== "1") {
          return errorResponse("BUSY", "Too many requests right now. Please try again shortly.", error.retryAfterSec);
        }
        raw = pickMockVerdict(req);
      }
    }

    const verdict: Verdict = enforceVerdictRules(raw, req.locale);
    return Response.json(verdict);
  } catch (error) {
    // Never log the request body: suspect messages must not be stored or printed.
    console.error("[analyze] unexpected error:", error instanceof Error ? error.name : "unknown");
    return errorResponse("INTERNAL", "Unexpected server error.");
  }
}
