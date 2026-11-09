import { describe, expect, it, vi } from "vitest";
import { analyzeWithGemini, BusyError, coerceVerdict, FALLBACK_MODEL, PRIMARY_MODEL, type GenerateFn } from "./gemini";
import { extractUrls } from "./urls";

const GOOD = {
  riskLevel: "CRITICAL",
  scamType: "INSTITUTION",
  summary: "택배 사칭 사기예요. 링크를 누르지 마세요.",
  redFlags: [{ label: "위조 도메인", evidence: "cj-logistics-kr.top/a8Fk2", explanation: "공식 주소가 아니에요." }],
  recommendedActions: [{ type: "DO_NOT_CLICK", label: "링크를 누르지 마세요" }],
  extractedUrls: ["cj-logistics-kr.top/a8Fk2"],
};

const apiError = (status: number) => Object.assign(new Error(`status ${status}`), { status });

describe("analyzeWithGemini", () => {
  it("sends text, locale, and server-extracted URLs; returns a verdict", async () => {
    const generate = vi.fn<GenerateFn>().mockResolvedValue(JSON.stringify(GOOD));
    const v = await analyzeWithGemini(
      { text: "주소 수정 cj-logistics-kr.top/a8Fk2 오늘 안에", locale: "vi-VN" },
      generate,
      0,
    );
    expect(v.riskLevel).toBe("CRITICAL");
    const call = generate.mock.calls[0][0];
    expect(call.model).toBe(PRIMARY_MODEL);
    expect(call.systemInstruction).toContain('"vi-VN"');
    expect(JSON.stringify(call.parts)).toContain("cj-logistics-kr.top/a8Fk2");
  });

  it("sends the screenshot as inline image data", async () => {
    const generate = vi.fn<GenerateFn>().mockResolvedValue(JSON.stringify(GOOD));
    await analyzeWithGemini({ image: { mimeType: "image/png", data: "AAAA" }, locale: "ko-KR" }, generate, 0);
    expect(generate.mock.calls[0][0].parts[0]).toEqual({ inlineData: { mimeType: "image/png", data: "AAAA" } });
  });

  it("retries 503 with backoff, then falls back to the fallback model", async () => {
    const generate = vi
      .fn<GenerateFn>()
      .mockRejectedValueOnce(apiError(503))
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce(JSON.stringify(GOOD));
    const v = await analyzeWithGemini({ text: "hi", locale: "ko-KR" }, generate, 0);
    expect(v.riskLevel).toBe("CRITICAL");
    expect(generate.mock.calls.map((c) => c[0].model)).toEqual([PRIMARY_MODEL, PRIMARY_MODEL, FALLBACK_MODEL]);
  });

  it("throws BusyError when every attempt is overloaded", async () => {
    const generate = vi.fn<GenerateFn>().mockRejectedValue(apiError(503));
    await expect(analyzeWithGemini({ text: "hi", locale: "ko-KR" }, generate, 0)).rejects.toBeInstanceOf(BusyError);
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it("does not retry the same model on a 400-class error, but still tries the fallback once", async () => {
    const generate = vi.fn<GenerateFn>().mockRejectedValue(apiError(403));
    await expect(analyzeWithGemini({ text: "hi", locale: "ko-KR" }, generate, 0)).rejects.toThrow("status 403");
    expect(generate.mock.calls.map((c) => c[0].model)).toEqual([PRIMARY_MODEL, FALLBACK_MODEL]);
  });

  it("falls back to the other model when the primary id is gone (404)", async () => {
    const generate = vi.fn<GenerateFn>().mockRejectedValueOnce(apiError(404)).mockResolvedValueOnce(JSON.stringify(GOOD));
    const v = await analyzeWithGemini({ text: "hi", locale: "ko-KR" }, generate, 0);
    expect(v.riskLevel).toBe("CRITICAL");
    expect(generate.mock.calls.map((c) => c[0].model)).toEqual([PRIMARY_MODEL, FALLBACK_MODEL]);
  });

  it.each([["an empty object", "{}"], ["an array", "[]"], ["null", "null"], ["a verdict with no summary", JSON.stringify({ ...GOOD, summary: "" })]])(
    "treats %s as a failed attempt and retries instead of returning a hollow verdict",
    async (_name, hollow) => {
      const generate = vi.fn<GenerateFn>().mockResolvedValueOnce(hollow).mockResolvedValueOnce(JSON.stringify(GOOD));
      const v = await analyzeWithGemini({ text: "hi", locale: "ko-KR" }, generate, 0);
      expect(v.summary).toBe(GOOD.summary);
      expect(generate).toHaveBeenCalledTimes(2);
    },
  );

  it("reports BUSY, not an empty 200, when every attempt comes back hollow", async () => {
    const generate = vi.fn<GenerateFn>().mockResolvedValue("{}");
    await expect(analyzeWithGemini({ text: "hi", locale: "ko-KR" }, generate, 0)).rejects.toBeInstanceOf(BusyError);
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it("retries once when the model returns malformed JSON", async () => {
    const generate = vi.fn<GenerateFn>().mockResolvedValueOnce("{not json").mockResolvedValueOnce(JSON.stringify(GOOD));
    const v = await analyzeWithGemini({ text: "hi", locale: "ko-KR" }, generate, 0);
    expect(v.scamType).toBe("INSTITUTION");
  });
});

describe("coerceVerdict", () => {
  it("unknown risk level becomes CAUTION; unknown scam type becomes OTHER", () => {
    const v = coerceVerdict({ ...GOOD, riskLevel: "SCARY", scamType: "ALIEN" }, []);
    expect(v.riskLevel).toBe("CAUTION");
    expect(v.scamType).toBe("OTHER");
  });

  it("drops unknown or duplicate action types and empty red flags", () => {
    const v = coerceVerdict(
      {
        ...GOOD,
        redFlags: [...GOOD.redFlags, { label: "", evidence: "x", explanation: "" }],
        recommendedActions: [
          { type: "OPEN_LINK", label: "링크 열기" },
          { type: "DO_NOT_CLICK", label: "누르지 마세요" },
          { type: "DO_NOT_CLICK", label: "중복" },
        ],
      },
      [],
    );
    expect(v.redFlags).toHaveLength(1);
    expect(v.recommendedActions).toEqual([{ type: "DO_NOT_CLICK", label: "누르지 마세요" }]);
  });

  it("merges server URLs with URLs the model read from a screenshot, ignoring junk", () => {
    const v = coerceVerdict({ ...GOOD, extractedUrls: ["bit.ly/abc", "not a url", "bit.ly/abc"] }, ["https://a.top/x"]);
    expect(v.extractedUrls).toEqual(["https://a.top/x", "bit.ly/abc"]);
  });

  it("survives a completely empty answer", () => {
    const v = coerceVerdict(null, []);
    expect(v).toMatchObject({ riskLevel: "CAUTION", redFlags: [], recommendedActions: [], extractedUrls: [] });
  });
});

describe("extractUrls", () => {
  it("finds scheme, www, and bare-domain links without trailing punctuation", () => {
    expect(extractUrls("보세요: http://x.top/a. 또는 www.naver.com, 그리고 cj-kr.top/a8F!")).toEqual([
      "http://x.top/a",
      "www.naver.com",
      "cj-kr.top/a8F",
    ]);
  });

  it("ignores email addresses and plain text", () => {
    expect(extractUrls("문의 help@bank.com 으로 주세요")).toEqual([]);
    expect(extractUrls("엄마 오늘 저녁 먹고 갈게")).toEqual([]);
  });
});
