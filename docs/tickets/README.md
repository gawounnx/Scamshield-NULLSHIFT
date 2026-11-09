# 티켓

`/to-tickets`로 SPEC.md의 Must와 S1을 나눈 티켓이에요. 진행 상태의 기준은 GitHub 이슈이고, 이 폴더는 그 사본이에요(2026-11-09 기준).

**GitHub:** [#8](https://github.com/gawounnx/Scamshield-NULLSHIFT/issues/8)

13:00 기능 동결까지의 구현 계획이에요. 기준 문서는 SPEC.md, 판정 API 계약은 docs/API.md예요.

## 완료

- [x] 앱 틀 (Next.js 16 + Tailwind + Vitest)
- [x] mock `POST /api/analyze` (요청 검증, 에러 형식, 후처리 규칙 4개, 테스트 36개)
- [x] 판정 API 계약 docs/API.md

## Must — 차가원 (프론트: 화면, M2 보호자 알림, 배포, 영상)

- [ ] #1 Walking skeleton: 텍스트 판정 흐름 + Vercel 배포
- [ ] #2 스크린샷 판정 (← #1)
- [ ] #4 온보딩과 설정 (← #1)
- [ ] #5 보호자 알림 공유 (← #1, #4)
- [ ] #6 데모 시나리오 회귀 테스트 (← #2, #5)

## Must — 고용민 (백엔드/AI: Gemini 판정, S1 URL 검사)

- [ ] #3 Gemini 판정 엔진 (바로 시작 가능)

## Should

- [ ] #7 S1 URL 검사 — 고용민 (← #3)
- 나머지 Should는 동결 전 시간이 남을 때만: S2 UI 다국어 · S3 자기 보호 모드 · S4 익명 판정 기록

#1과 #3은 서로 막지 않아서 동시에 시작할 수 있어요.

