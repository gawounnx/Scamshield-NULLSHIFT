# 06: [Must·가원] 데모 시나리오 회귀 테스트

**GitHub:** [#6](https://github.com/gawounnx/Scamshield-NULLSHIFT/issues/6)

**담당:** 차가원 (프론트: 화면, M2 보호자 알림, 배포, 영상)

## What to build

데모 시나리오가 깨지지 않았는지 한 번에 확인하는 회귀 테스트예요. `webapp-testing`(Playwright)으로 판정 API를 가짜로 대체한 상태에서 데모 흐름을 돌려요: 온보딩(60세 이상 + 보호자 지정) → 택배 스미싱 스크린샷 매우 위험 + 보호자 알리기 → 링크 없는 지인 사칭 위험 → 영어 메시지 기기 언어 판정 → 정상 택배 안전. Feature freeze 이후 Polish 단계의 기준이에요.

## Acceptance criteria

- [ ] 데모 시나리오 2–6을 도는 Playwright 테스트가 있어요
- [ ] 판정 API 응답은 테스트 안에서 가짜로 대체돼 Gemini 쿼터를 쓰지 않아요
- [ ] 3회 연속 통과해요(하네스 기준)
- [ ] 실행 방법이 한 줄 명령으로 정리돼 있어요

## Blocked by

- #2
- #5
