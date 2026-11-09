# 판정 API — `POST /api/analyze`

> 프론트·백엔드 계약이에요. `Verdict` 타입은 [SPEC.md](../SPEC.md)의 "판정 형식"과 같고, 용어는 [GLOSSARY.md](../GLOSSARY.md)를 따라요. 이 문서를 바꾸면 SPEC.md도 같이 바꿔요.

의심 메시지(스크린샷 또는 텍스트)와 기기 언어를 받아서 판정 하나를 돌려줘요. 로그인은 없고, 서버는 원문과 이미지를 저장하지 않아요.

## 요청

- `Content-Type: application/json`
- 이미지는 base64로 넣어요. Vercel 요청 본문 한도(4.5MB) 때문에, 클라이언트가 긴 변 1600px 이하 JPEG로 줄여서 보내요.
- `text`와 `image` 중 하나는 꼭 있어야 하고, 둘 다 보내도 돼요.

```ts
type ImageMimeType = "image/png" | "image/jpeg" | "image/webp";

interface AnalyzeRequest {
  text?: string;                 // 붙여넣은 메시지. 앞뒤 공백을 뺀 뒤 최대 5,000자(이모지도 1자). 공백뿐이면 없는 것으로 봐요
  image?: {
    mimeType: ImageMimeType;
    data: string;                // base64, "data:" 접두어 없이, 최대 4,000,000자(원본 약 3MB)
  };
  locale: string;                // BCP 47, navigator.language 그대로 (예: "ko-KR", "en-US", "vi-VN")
}
```

## 응답 (200)

본문이 곧 판정이에요.

```ts
type RiskLevel = "SAFE" | "CAUTION" | "DANGER" | "CRITICAL";

type ScamType =
  | "INSTITUTION"   // 기관 사칭: 택배, 공공기관, 검찰·경찰
  | "FINANCIAL"     // 금융 사칭: 은행, 카드, 결제 청구
  | "ACQUAINTANCE"  // 지인 사칭: 가족·친구, 메신저피싱
  | "INVESTMENT"    // 투자 사기: 리딩방, 코인
  | "ROMANCE"       // 로맨스 스캠
  | "LOAN"          // 대출 사기
  | "OTHER";        // 기타

type ActionType =
  | "DO_NOT_CLICK"        // 링크를 누르지 마세요
  | "CALL_112"            // 112에 전화 (신고·지급정지)
  | "CALL_OFFICIAL"       // 공식 대표번호로 직접 확인
  | "ALERT_GUARDIAN"      // 보호자에게 알리기
  | "VERIFY_WITH_PERSON"  // 원래 알던 번호로 본인에게 확인
  | "BLOCK_SENDER"        // 발신자 차단
  | "NONE";               // 따로 할 일 없음

interface RedFlag {
  label: string;        // locale 언어, 짧은 이름 (예: "위조 도메인")
  evidence: string;     // 원문 인용. 번역하지 않고 메시지에 적힌 그대로
  explanation: string;  // locale 언어, 왜 의심스러운지 한두 문장
}

interface RecommendedAction {
  type: ActionType;
  label: string;        // locale 언어, 버튼 문구
}

interface Verdict {
  riskLevel: RiskLevel;
  scamType: ScamType | null;            // SAFE이면 null
  summary: string;                      // locale 언어, 한 줄 결론
  redFlags: RedFlag[];                  // SAFE이면 빈 배열일 수 있음
  recommendedActions: RecommendedAction[]; // 중요한 것부터
  extractedUrls: string[];              // 메시지에서 찾은 URL, 없으면 []
}
```

### 언어 규칙

- `summary`, `redFlags[].label`, `redFlags[].explanation`, `recommendedActions[].label`은 `locale` 언어로 나와요.
- `redFlags[].evidence`는 메시지 원문 언어 그대로예요. 스크린샷이면 이미지에서 읽은 글자를 인용해요.
- 문장은 70대가 이해할 수 있는 쉬운 말로 써요.

### 서버가 항상 지키는 규칙 (후처리)

Gemini 출력과 상관없이 서버가 강제하므로, 프론트는 이 규칙을 믿고 화면을 그려도 돼요.

| 조건 | 보장 |
|---|---|
| `riskLevel`이 `DANGER` 이상 | `recommendedActions`에 `ALERT_GUARDIAN`이 있어요 |
| `riskLevel`이 `CRITICAL` | `recommendedActions`에 `CALL_112`가 있어요 |
| `riskLevel`이 `SAFE` | `scamType`이 `null`이에요 |
| 항상 | 링크를 열라고 권하는 행동은 없어요 |

**프론트 처리 메모**
- 서버는 보호자 정보를 모르기 때문에(기기에만 저장) `ALERT_GUARDIAN`을 항상 넣어요. 보호자가 없으면 프론트가 이 버튼을 숨기고, (S3) 자기 보호 모드로 넘겨요.
- 112 전화 버튼은 `CALL_112`가 있을 때 `tel:112`로 그려요.

## 에러

```ts
type AnalyzeErrorCode =
  | "INVALID_INPUT"      // 400: text·image 둘 다 없음, locale 없음, 형식 오류
  | "PAYLOAD_TOO_LARGE"  // 413: 이미지나 텍스트가 한도를 넘음, 또는 요청 본문이 4.5MB를 넘음
  | "BUSY"               // 503: Gemini 503·쿼터 초과로 재시도까지 실패
  | "INTERNAL";          // 500: 그 밖의 서버 오류

interface AnalyzeError {
  error: {
    code: AnalyzeErrorCode;
    message: string;          // 개발용 영어 설명. 화면 문구는 프론트가 code로 정해요
    retryAfterSec?: number;   // BUSY일 때만
  };
}
```

`BUSY`이면 화면에 친절한 재시도 안내를 보여줘요(User Story 25). 데모 샘플 4개는 Gemini가 실패해도 캐시해 둔 판정으로 200을 돌려줘요.

## Mock 응답 예시

SPEC의 샘플 스모크 테스트 4개와 같은 메시지예요. Walking skeleton과 Playwright 데모 회귀에서 가짜 판정으로 써요.

### 1. 택배 스미싱 스크린샷 → CRITICAL

요청:

```json
{
  "image": { "mimeType": "image/jpeg", "data": "/9j/4AAQSkZJRgABAQ...(생략)" },
  "locale": "ko-KR"
}
```

이미지 속 메시지: `[Web발신] 고객님의 택배가 주소지 불일치로 보관 중입니다. 오늘 안에 주소를 수정하지 않으면 반송됩니다. https://cj-logistics-kr.top/a8Fk2`

응답:

```json
{
  "riskLevel": "CRITICAL",
  "scamType": "INSTITUTION",
  "summary": "택배 회사를 사칭한 사기 문자예요. 링크를 절대 누르지 마세요.",
  "redFlags": [
    {
      "label": "위조 도메인",
      "evidence": "https://cj-logistics-kr.top/a8Fk2",
      "explanation": "택배 회사의 공식 주소가 아니에요. 이름을 비슷하게 흉내 낸 가짜 주소예요."
    },
    {
      "label": "긴급성 유도",
      "evidence": "오늘 안에 주소를 수정하지 않으면 반송됩니다",
      "explanation": "시간이 없다고 서두르게 만들어서 생각할 틈을 주지 않으려는 수법이에요."
    }
  ],
  "recommendedActions": [
    { "type": "DO_NOT_CLICK", "label": "링크를 누르지 마세요" },
    { "type": "CALL_112", "label": "112에 전화하기" },
    { "type": "ALERT_GUARDIAN", "label": "보호자에게 알리기" },
    { "type": "BLOCK_SENDER", "label": "이 번호 차단하기" }
  ],
  "extractedUrls": ["https://cj-logistics-kr.top/a8Fk2"]
}
```

### 2. 링크 없는 지인 사칭 → DANGER

요청:

```json
{
  "text": "엄마 나 폰 액정 깨져서 수리 맡겼어. 이 번호로 문자만 돼. 급하게 결제할 게 있는데 엄마 카드 앞뒤 사진이랑 비밀번호 좀 보내줘. 아빠한테는 말하지 말고",
  "locale": "ko-KR"
}
```

응답:

```json
{
  "riskLevel": "DANGER",
  "scamType": "ACQUAINTANCE",
  "summary": "가족을 사칭한 사기일 가능성이 높아요. 카드 정보를 보내지 마세요.",
  "redFlags": [
    {
      "label": "새 번호로 연락",
      "evidence": "폰 액정 깨져서 수리 맡겼어. 이 번호로 문자만 돼",
      "explanation": "폰이 고장 났다며 모르는 번호로 연락하는 건 가족 사칭 사기의 대표적인 시작이에요."
    },
    {
      "label": "카드 정보 요구",
      "evidence": "엄마 카드 앞뒤 사진이랑 비밀번호 좀 보내줘",
      "explanation": "가족이라도 문자로 카드 사진과 비밀번호를 달라고 하지 않아요."
    },
    {
      "label": "비밀 유지 요구",
      "evidence": "아빠한테는 말하지 말고",
      "explanation": "다른 가족에게 확인하지 못하게 막으려는 말이에요."
    }
  ],
  "recommendedActions": [
    { "type": "VERIFY_WITH_PERSON", "label": "원래 알던 번호로 자녀에게 직접 전화하기" },
    { "type": "ALERT_GUARDIAN", "label": "보호자에게 알리기" },
    { "type": "BLOCK_SENDER", "label": "이 번호 차단하기" }
  ],
  "extractedUrls": []
}
```

### 3. 영어 계정 잠금 문자, 한국어 기기 → DANGER

외국어 메시지도 기기 언어로 판정해요. `evidence`만 원문(영어) 그대로예요.

요청:

```json
{
  "text": "ALERT: Your bank account has been temporarily locked due to unusual activity. Verify your identity within 24 hours to avoid permanent suspension: http://secure-acct-verify.top/login",
  "locale": "ko-KR"
}
```

응답:

```json
{
  "riskLevel": "DANGER",
  "scamType": "FINANCIAL",
  "summary": "은행을 사칭해 로그인 정보를 훔치려는 사기 문자예요. 링크를 누르지 마세요.",
  "redFlags": [
    {
      "label": "위조 도메인",
      "evidence": "http://secure-acct-verify.top/login",
      "explanation": "은행의 공식 주소가 아니에요. 로그인 정보를 입력하게 만드는 가짜 사이트예요."
    },
    {
      "label": "계정 잠금 협박",
      "evidence": "Verify your identity within 24 hours to avoid permanent suspension",
      "explanation": "24시간 안에 확인하지 않으면 계정이 영구 정지된다고 겁을 줘서 서두르게 만들어요."
    }
  ],
  "recommendedActions": [
    { "type": "DO_NOT_CLICK", "label": "링크를 누르지 마세요" },
    { "type": "CALL_OFFICIAL", "label": "은행 공식 대표번호로 직접 확인하기" },
    { "type": "ALERT_GUARDIAN", "label": "보호자에게 알리기" }
  ],
  "extractedUrls": ["http://secure-acct-verify.top/login"]
}
```

### 4. 정상 택배 알림 → SAFE

요청:

```json
{
  "text": "[CJ대한통운] 고객님의 상품이 오늘(11/9) 14~16시 사이 배송될 예정입니다. 담당 기사: 김OO",
  "locale": "ko-KR"
}
```

응답:

```json
{
  "riskLevel": "SAFE",
  "scamType": null,
  "summary": "일반적인 배송 안내 문자예요. 사기 신호가 보이지 않아요.",
  "redFlags": [],
  "recommendedActions": [
    { "type": "NONE", "label": "따로 할 일은 없어요" }
  ],
  "extractedUrls": []
}
```
