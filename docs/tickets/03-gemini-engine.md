# 03: [M1·용민] Gemini 판정 엔진

**GitHub:** [#3](https://github.com/gawounnx/Scamshield-NULLSHIFT/issues/3)

**담당:** 고용민 (백엔드/AI: Gemini 판정, S1 URL 검사)

## What to build

판정 API가 mock 대신 Gemini Flash-Lite로 실제 판정을 내려요. 텍스트와 스크린샷을 받아 구조화 출력(JSON 스키마)으로 판정을 만들고, `summary`·의심 신호 설명·권장 행동 문구는 요청의 `locale` 언어로, 의심 신호 `evidence`는 원문 그대로 인용해요. 서버 후처리 규칙 4개는 지금처럼 모든 판정에 적용돼요.

SPEC.md의 프롬프트 결정을 따라요: 확신이 없으면 CAUTION, 의심 신호마다 원문 인용, 메시지 속 번호로 전화하거나 답장하라고 권하지 않기, 70대가 이해할 쉬운 말. 지인 사칭 신호(새 번호, 비밀 요구, 송금·카드 정보 요구)를 프롬프트에 넣어요.

Gemini 503·쿼터 오류는 지수 백오프로 재시도해요. 그래도 실패하면 데모 샘플 4개는 캐시해 둔 판정으로 200을 돌려주고, 그 밖의 입력은 `BUSY`(503, `retryAfterSec` 포함)를 돌려줘요. 화면은 `BUSY`일 때 친절한 재시도 안내를 보여줘요(User Story 25).

API 키는 `.env`에만 두고, 원문과 이미지는 저장하거나 로그로 출력하지 않아요.

## Acceptance criteria

- [ ] 샘플 스모크 테스트 4개가 기대 범위로 나와요(수동 실행): 택배 스미싱 CRITICAL/DANGER·INSTITUTION, 지인 사칭 DANGER 이상·ACQUAINTANCE, 영어 계정 잠금 DANGER 이상, 정상 택배 SAFE·null
- [ ] `locale`이 `en-US`면 요약과 문구가 영어로, `ko-KR`면 한국어로 나와요
- [ ] 스크린샷 입력도 판정되고, `evidence`는 이미지 속 글자를 인용해요
- [ ] Gemini를 가짜로 바꾼 상태에서 후처리 규칙 테스트 4개가 통과해요
- [ ] Gemini가 계속 실패하면 데모 샘플은 캐시 판정, 그 밖에는 `BUSY`가 나오고 화면에 재시도 안내가 보여요
- [ ] 서버 로그에 원문·이미지·API 키가 찍히지 않아요

## Blocked by

None (can start immediately)
