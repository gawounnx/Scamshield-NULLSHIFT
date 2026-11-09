import { describe, expect, it } from "vitest";
import { POST } from "./route";
import type { AnalyzeError, Verdict } from "@/lib/analyze/types";
import { MAX_IMAGE_BASE64_CHARS, MAX_TEXT_CHARS } from "@/lib/analyze/validate";

const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function post(body: unknown, contentType = "application/json"): Promise<Response> {
  return POST(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": contentType },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function verdictFor(body: unknown): Promise<Verdict> {
  const res = await post(body);
  expect(res.status).toBe(200);
  return res.json();
}

async function errorFor(body: unknown, status: number, code: string, contentType?: string) {
  const res = await post(body, contentType);
  expect(res.status).toBe(status);
  const json: AnalyzeError = await res.json();
  expect(json.error.code).toBe(code);
  expect(typeof json.error.message).toBe("string");
}

describe("POST /api/analyze — mock verdicts for the demo samples", () => {
  it("screenshot of parcel smishing → CRITICAL, INSTITUTION", async () => {
    const v = await verdictFor({ image: { mimeType: "image/png", data: TINY_PNG }, locale: "ko-KR" });
    expect(v.riskLevel).toBe("CRITICAL");
    expect(v.scamType).toBe("INSTITUTION");
  });

  it("acquaintance impersonation without a link → DANGER, ACQUAINTANCE", async () => {
    const v = await verdictFor({
      text: "엄마 나 폰 액정 깨져서 수리 맡겼어. 이 번호로 문자만 돼. 급하게 결제할 게 있는데 엄마 카드 앞뒤 사진이랑 비밀번호 좀 보내줘. 아빠한테는 말하지 말고",
      locale: "ko-KR",
    });
    expect(v.riskLevel).toBe("DANGER");
    expect(v.scamType).toBe("ACQUAINTANCE");
    expect(v.extractedUrls).toEqual([]);
  });

  it("English account-lock text → DANGER, FINANCIAL", async () => {
    const v = await verdictFor({
      text: "ALERT: Your bank account has been temporarily locked due to unusual activity. Verify your identity within 24 hours to avoid permanent suspension: http://secure-acct-verify.top/login",
      locale: "ko-KR",
    });
    expect(v.riskLevel).toBe("DANGER");
    expect(v.scamType).toBe("FINANCIAL");
  });

  it("Korean text with a link → CRITICAL, INSTITUTION", async () => {
    const v = await verdictFor({
      text: "[Web발신] 고객님의 택배가 주소지 불일치로 보관 중입니다. https://cj-logistics-kr.top/a8Fk2",
      locale: "ko-KR",
    });
    expect(v.riskLevel).toBe("CRITICAL");
  });

  it("normal parcel notice → SAFE with null scamType", async () => {
    const v = await verdictFor({
      text: "[CJ대한통운] 고객님의 상품이 오늘(11/9) 14~16시 사이 배송될 예정입니다. 담당 기사: 김OO",
      locale: "ko-KR",
    });
    expect(v.riskLevel).toBe("SAFE");
    expect(v.scamType).toBeNull();
    expect(v.redFlags).toEqual([]);
  });

  it("catches a bare-domain link without http(s)", async () => {
    const v = await verdictFor({ text: "[Web발신] 택배 보관 중. cj-logistics-kr.top/a8Fk2 에서 주소 수정", locale: "ko-KR" });
    expect(v.riskLevel).toBe("CRITICAL");
  });

  it("does not flag an ordinary family message", async () => {
    const v = await verdictFor({ text: "엄마 오늘 저녁 먹고 갈게", locale: "ko-KR" });
    expect(v.riskLevel).toBe("SAFE");
  });

  it("a link wins over a family word", async () => {
    const v = await verdictFor({ text: "엄마 이 택배 문자 뭐야 https://cj-logistics-kr.top/a8Fk2", locale: "ko-KR" });
    expect(v.riskLevel).toBe("CRITICAL");
  });

  it("a screenshot with a harmless note still uses the screenshot mock", async () => {
    const v = await verdictFor({ text: "이거 뭐야?", image: { mimeType: "image/png", data: TINY_PNG }, locale: "ko-KR" });
    expect(v.riskLevel).toBe("CRITICAL");
  });

  it("every mock satisfies the post-processing guarantees", async () => {
    const inputs = [
      { image: { mimeType: "image/png", data: TINY_PNG }, locale: "ko-KR" },
      { text: "엄마 나 폰 깨졌어", locale: "ko-KR" },
      { text: "Verify now: http://x.top", locale: "en-US" },
      { text: "배송 예정입니다", locale: "ko-KR" },
    ];
    for (const input of inputs) {
      const v = await verdictFor(input);
      const types = v.recommendedActions.map((a) => a.type);
      if (v.riskLevel === "DANGER" || v.riskLevel === "CRITICAL") expect(types).toContain("ALERT_GUARDIAN");
      if (v.riskLevel === "CRITICAL") expect(types).toContain("CALL_112");
      if (v.riskLevel === "SAFE") expect(v.scamType).toBeNull();
    }
  });
});

describe("POST /api/analyze — request validation", () => {
  it("rejects a non-JSON content type", () =>
    errorFor("text=hi&locale=ko-KR", 400, "INVALID_INPUT", "application/x-www-form-urlencoded"));

  it("accepts application/json with a charset", async () => {
    const res = await post({ text: "배송 예정입니다", locale: "ko-KR" }, "application/json; charset=utf-8");
    expect(res.status).toBe(200);
  });

  it("rejects look-alike JSON media types", () =>
    errorFor({ text: "hi", locale: "ko-KR" }, 400, "INVALID_INPUT", "application/jsonx"));

  it("rejects a declared body over the size limit with 413 before parsing", async () => {
    const res = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": "5000000" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects malformed JSON", () => errorFor("{not json", 400, "INVALID_INPUT"));

  it("rejects a non-object body", () => errorFor([1, 2], 400, "INVALID_INPUT"));

  it("rejects a missing locale", () => errorFor({ text: "hello" }, 400, "INVALID_INPUT"));

  it("rejects an invalid locale", () => errorFor({ text: "hello", locale: "not a locale!" }, 400, "INVALID_INPUT"));

  it("rejects when neither text nor image is given", () => errorFor({ locale: "ko-KR" }, 400, "INVALID_INPUT"));

  it("treats whitespace-only text as missing", () => errorFor({ text: "   ", locale: "ko-KR" }, 400, "INVALID_INPUT"));

  it("rejects non-string text", () => errorFor({ text: 42, locale: "ko-KR" }, 400, "INVALID_INPUT"));

  it("rejects an unsupported image type", () =>
    errorFor({ image: { mimeType: "image/gif", data: TINY_PNG }, locale: "ko-KR" }, 400, "INVALID_INPUT"));

  it("rejects image data with a data: prefix", () =>
    errorFor(
      { image: { mimeType: "image/png", data: `data:image/png;base64,${TINY_PNG}` }, locale: "ko-KR" },
      400,
      "INVALID_INPUT",
    ));

  it("rejects image data that is not base64", () =>
    errorFor({ image: { mimeType: "image/png", data: "not base64!" }, locale: "ko-KR" }, 400, "INVALID_INPUT"));

  it("accepts text at the limit", async () => {
    await verdictFor({ text: "가".repeat(MAX_TEXT_CHARS), locale: "ko-KR" });
  });

  it("does not count surrounding whitespace toward the limit", async () => {
    await verdictFor({ text: `${"가".repeat(MAX_TEXT_CHARS)}\n\n   \n`, locale: "ko-KR" });
  });

  it("counts an emoji as one character", async () => {
    await verdictFor({ text: "😀".repeat(MAX_TEXT_CHARS), locale: "ko-KR" });
  });

  it("rejects text over the limit with 413", () =>
    errorFor({ text: "가".repeat(MAX_TEXT_CHARS + 1), locale: "ko-KR" }, 413, "PAYLOAD_TOO_LARGE"));

  it("rejects very long text with 413", () =>
    errorFor({ text: "a".repeat(MAX_TEXT_CHARS * 3), locale: "ko-KR" }, 413, "PAYLOAD_TOO_LARGE"));

  it("rejects an oversized image with 413", () =>
    errorFor(
      { image: { mimeType: "image/png", data: "A".repeat(MAX_IMAGE_BASE64_CHARS + 4) }, locale: "ko-KR" },
      413,
      "PAYLOAD_TOO_LARGE",
    ));
});
