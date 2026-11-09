import type { AnalyzeRequest, Verdict } from "./types";

// The four mock verdicts from docs/API.md, one per demo smoke-test sample.

export const PARCEL_SMISHING: Verdict = {
  riskLevel: "CRITICAL",
  scamType: "INSTITUTION",
  summary: "택배 회사를 사칭한 사기 문자예요. 링크를 절대 누르지 마세요.",
  redFlags: [
    {
      label: "위조 도메인",
      evidence: "https://cj-logistics-kr.top/a8Fk2",
      explanation: "택배 회사의 공식 주소가 아니에요. 이름을 비슷하게 흉내 낸 가짜 주소예요.",
    },
    {
      label: "긴급성 유도",
      evidence: "오늘 안에 주소를 수정하지 않으면 반송됩니다",
      explanation: "시간이 없다고 서두르게 만들어서 생각할 틈을 주지 않으려는 수법이에요.",
    },
  ],
  recommendedActions: [
    { type: "DO_NOT_CLICK", label: "링크를 누르지 마세요" },
    { type: "CALL_112", label: "112에 전화하기" },
    { type: "ALERT_GUARDIAN", label: "보호자에게 알리기" },
    { type: "BLOCK_SENDER", label: "이 번호 차단하기" },
  ],
  extractedUrls: ["https://cj-logistics-kr.top/a8Fk2"],
};

export const ACQUAINTANCE_IMPERSONATION: Verdict = {
  riskLevel: "DANGER",
  scamType: "ACQUAINTANCE",
  summary: "가족을 사칭한 사기일 가능성이 높아요. 카드 정보를 보내지 마세요.",
  redFlags: [
    {
      label: "새 번호로 연락",
      evidence: "폰 액정 깨져서 수리 맡겼어. 이 번호로 문자만 돼",
      explanation:
        "폰이 고장 났다며 모르는 번호로 연락하는 건 가족 사칭 사기의 대표적인 시작이에요.",
    },
    {
      label: "카드 정보 요구",
      evidence: "엄마 카드 앞뒤 사진이랑 비밀번호 좀 보내줘",
      explanation: "가족이라도 문자로 카드 사진과 비밀번호를 달라고 하지 않아요.",
    },
    {
      label: "비밀 유지 요구",
      evidence: "아빠한테는 말하지 말고",
      explanation: "다른 가족에게 확인하지 못하게 막으려는 말이에요.",
    },
  ],
  recommendedActions: [
    { type: "VERIFY_WITH_PERSON", label: "원래 알던 번호로 자녀에게 직접 전화하기" },
    { type: "ALERT_GUARDIAN", label: "보호자에게 알리기" },
    { type: "BLOCK_SENDER", label: "이 번호 차단하기" },
  ],
  extractedUrls: [],
};

export const ENGLISH_ACCOUNT_LOCK: Verdict = {
  riskLevel: "DANGER",
  scamType: "FINANCIAL",
  summary: "은행을 사칭해 로그인 정보를 훔치려는 사기 문자예요. 링크를 누르지 마세요.",
  redFlags: [
    {
      label: "위조 도메인",
      evidence: "http://secure-acct-verify.top/login",
      explanation: "은행의 공식 주소가 아니에요. 로그인 정보를 입력하게 만드는 가짜 사이트예요.",
    },
    {
      label: "계정 잠금 협박",
      evidence: "Verify your identity within 24 hours to avoid permanent suspension",
      explanation: "24시간 안에 확인하지 않으면 계정이 영구 정지된다고 겁을 줘서 서두르게 만들어요.",
    },
  ],
  recommendedActions: [
    { type: "DO_NOT_CLICK", label: "링크를 누르지 마세요" },
    { type: "CALL_OFFICIAL", label: "은행 공식 대표번호로 직접 확인하기" },
    { type: "ALERT_GUARDIAN", label: "보호자에게 알리기" },
  ],
  extractedUrls: ["http://secure-acct-verify.top/login"],
};

export const NORMAL_PARCEL: Verdict = {
  riskLevel: "SAFE",
  scamType: null,
  summary: "일반적인 배송 안내 문자예요. 사기 신호가 보이지 않아요.",
  redFlags: [],
  recommendedActions: [{ type: "NONE", label: "따로 할 일은 없어요" }],
  extractedUrls: [],
};

// Scheme, www., or a bare domain such as "cj-logistics-kr.top/a8Fk2".
const URL_PATTERN = /https?:\/\/\S+|\bwww\.\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\/\S*/i;
const HANGUL_PATTERN = /[가-힣]/;
// Acquaintance-scam asks, not just a family word: broken phone, card details, transfer requests.
const ACQUAINTANCE_PATTERN =
  /(폰|액정).{0,15}(깨|고장|수리)|카드.{0,15}(사진|비밀번호)|(송금|이체).{0,15}(해\s?줘|부탁)/;

// TODO: replace with the Gemini call (M1). Until then, pick a mock by simple input cues:
// link in Korean text → parcel smishing, link in other text → English account lock,
// acquaintance-scam asks → acquaintance, screenshot → parcel smishing (the image is
// not read), otherwise safe. Mock evidence/URLs are the docs/API.md samples, not the
// user's message, and mock text is Korean only (locale is not applied yet).
export function pickMockVerdict(request: AnalyzeRequest): Verdict {
  const text = request.text ?? "";
  if (URL_PATTERN.test(text)) {
    return HANGUL_PATTERN.test(text) ? PARCEL_SMISHING : ENGLISH_ACCOUNT_LOCK;
  }
  if (ACQUAINTANCE_PATTERN.test(text)) return ACQUAINTANCE_IMPERSONATION;
  if (request.image) return PARCEL_SMISHING;
  return NORMAL_PARCEL;
}

// Demo sample texts from docs/API.md. When Gemini is busy, these still get their cached
// verdict (docs/API.md "BUSY"). The screenshot sample can't be matched by text; set
// ANALYZE_MOCK_ON_BUSY=1 while recording the demo to cover it.
const DEMO_SAMPLE_TEXTS = new Set([
  "엄마 나 폰 액정 깨져서 수리 맡겼어. 이 번호로 문자만 돼. 급하게 결제할 게 있는데 엄마 카드 앞뒤 사진이랑 비밀번호 좀 보내줘. 아빠한테는 말하지 말고",
  "ALERT: Your bank account has been temporarily locked due to unusual activity. Verify your identity within 24 hours to avoid permanent suspension: http://secure-acct-verify.top/login",
  "[CJ대한통운] 고객님의 상품이 오늘(11/9) 14~16시 사이 배송될 예정입니다. 담당 기사: 김OO",
]);

export function isDemoSample(request: AnalyzeRequest): boolean {
  return !request.image && DEMO_SAMPLE_TEXTS.has((request.text ?? "").trim());
}
