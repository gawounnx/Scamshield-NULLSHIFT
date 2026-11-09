# 07: [S1·용민] URL 검사

**GitHub:** [#7](https://github.com/gawounnx/Scamshield-NULLSHIFT/issues/7)

**담당:** 고용민 (백엔드/AI: Gemini 판정, S1 URL 검사)

## What to build

메시지 속 링크가 위조 도메인이거나 위험 목록에 있다는 근거가 판정에 들어가요(User Story 27). 검사는 문자열 파싱 규칙(공식 도메인 목록과의 유사 도메인, 의심 TLD, 단축 URL)과 Google Safe Browsing 조회로만 하고, 링크를 직접 열거나 페치하지 않아요. 검사 결과는 프롬프트에 사실로 주입하고, 해당하면 "위조 도메인" 같은 의심 신호로 판정에 나와요.

## Acceptance criteria

- [ ] 공식 택배·은행 도메인을 흉내 낸 도메인이 "위조 도메인" 의심 신호로 나와요
- [ ] 의심 TLD와 단축 URL이 규칙으로 잡혀요
- [ ] Safe Browsing에 걸린 URL은 그 사실이 판정 근거에 들어가요
- [ ] Safe Browsing 조회가 실패해도 판정은 나와요
- [ ] 어떤 경우에도 서버가 추출한 링크를 열지 않아요

## Blocked by

- #3
