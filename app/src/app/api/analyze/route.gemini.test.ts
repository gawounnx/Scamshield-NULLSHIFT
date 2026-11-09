import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyzeError, Verdict } from "@/lib/analyze/types";
import { SAMPLE_MESSAGES } from "@/lib/samples";

const analyzeWithGemini = vi.fn();
vi.mock("@/lib/analyze/gemini", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analyze/gemini")>()),
  analyzeWithGemini: (...args: unknown[]) => analyzeWithGemini(...args),
}));

const { POST } = await import("./route");
const { BusyError } = await import("@/lib/analyze/gemini");

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/analyze — with GEMINI_API_KEY", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("ANALYZE_MOCK_ON_BUSY", "");
    analyzeWithGemini.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("uses the Gemini verdict and still enforces the post-processing rules", async () => {
    analyzeWithGemini.mockResolvedValue({
      riskLevel: "CRITICAL",
      scamType: "INSTITUTION",
      summary: "Scam.",
      redFlags: [],
      recommendedActions: [],
      extractedUrls: [],
    } satisfies Verdict);
    const res = await post({ text: "anything", locale: "en-US" });
    expect(res.status).toBe(200);
    const v: Verdict = await res.json();
    expect(v.recommendedActions.map((a) => a.type)).toEqual(["CALL_112", "ALERT_GUARDIAN"]);
    expect(v.recommendedActions[0].label).toBe("Call 112 (police)");
  });

  it("returns 503 BUSY with retryAfterSec when Gemini stays overloaded", async () => {
    analyzeWithGemini.mockRejectedValue(new BusyError());
    const res = await post({ text: "처음 보는 문자", locale: "ko-KR" });
    expect(res.status).toBe(503);
    const json: AnalyzeError = await res.json();
    expect(json.error.code).toBe("BUSY");
    expect(json.error.retryAfterSec).toBeGreaterThan(0);
  });

  it("keeps the cached verdict for a demo sample when Gemini is busy", async () => {
    analyzeWithGemini.mockRejectedValue(new BusyError());
    const res = await post({
      text: "[CJ대한통운] 고객님의 상품이 오늘(11/9) 14~16시 사이 배송될 예정입니다. 담당 기사: 김OO",
      locale: "ko-KR",
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as Verdict).riskLevel).toBe("SAFE");
  });

  it("every sample button keeps a cached verdict when Gemini is busy", async () => {
    analyzeWithGemini.mockRejectedValue(new BusyError());
    for (const sample of SAMPLE_MESSAGES) {
      const res = await post({ text: sample.text, locale: "ko-KR" });
      expect(res.status, sample.id).toBe(200);
    }
  });

  it("the parcel-smishing sample is cached as CRITICAL while busy", async () => {
    analyzeWithGemini.mockRejectedValue(new BusyError());
    const parcel = SAMPLE_MESSAGES.find((s) => s.id === "parcel-smishing")!;
    const res = await post({ text: parcel.text, locale: "ko-KR" });
    expect(((await res.json()) as Verdict).riskLevel).toBe("CRITICAL");
  });

  it("ANALYZE_MOCK_ON_BUSY=1 answers any request with a mock while recording", async () => {
    vi.stubEnv("ANALYZE_MOCK_ON_BUSY", "1");
    analyzeWithGemini.mockRejectedValue(new BusyError());
    const res = await post({ image: { mimeType: "image/png", data: "iVBORw0KGgo=" }, locale: "ko-KR" });
    expect(res.status).toBe(200);
  });

  it("an unexpected Gemini error (e.g. bad key) becomes 500 INTERNAL", async () => {
    analyzeWithGemini.mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 }));
    const res = await post({ text: "hi", locale: "ko-KR" });
    expect(res.status).toBe(500);
  });
});
