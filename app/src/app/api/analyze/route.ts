import { pickMockVerdict } from "@/lib/analyze/mocks";
import { enforceVerdictRules } from "@/lib/analyze/postprocess";
import type { AnalyzeError, AnalyzeErrorCode, Verdict } from "@/lib/analyze/types";
import { validateAnalyzeRequest } from "@/lib/analyze/validate";

// Vercel's request body limit. Reject early instead of buffering a larger body.
const MAX_BODY_BYTES = 4_500_000;

const STATUS: Record<AnalyzeErrorCode, number> = {
  INVALID_INPUT: 400,
  PAYLOAD_TOO_LARGE: 413,
  BUSY: 503,
  INTERNAL: 500,
};

function errorResponse(code: AnalyzeErrorCode, message: string): Response {
  const body: AnalyzeError = { error: { code, message } };
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

    const verdict: Verdict = enforceVerdictRules(pickMockVerdict(result.request));
    return Response.json(verdict);
  } catch (error) {
    // Never log the request body: suspect messages must not be stored or printed.
    console.error("[analyze] unexpected error:", error instanceof Error ? error.name : "unknown");
    return errorResponse("INTERNAL", "Unexpected server error.");
  }
}
