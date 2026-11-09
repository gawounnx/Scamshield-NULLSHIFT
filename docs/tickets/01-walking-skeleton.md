# 01: [M1·가원] Walking skeleton: 텍스트 판정 흐름 + Vercel 배포

**GitHub:** [#1](https://github.com/gawounnx/Scamshield-NULLSHIFT/issues/1)

**담당:** 차가원 (프론트: 화면, M2 보호자 알림, 배포, 영상)

## What to build

사용자가 홈에서 의심 메시지 텍스트를 붙여넣거나 샘플 메시지 3개 중 하나를 누르면, 분석 중 화면을 거쳐 판정 화면이 나와요. 판정 API는 지금 있는 mock 응답을 그대로 써요. 배포 URL에서 이 흐름이 끝까지 동작해야 해요.

판정 화면은 위험 등급 색 배지, 한 줄 결론(요약), 사기 유형, 원문 인용이 붙은 의심 신호, 권장 행동 버튼으로 이루어져요. 매우 위험이면 112 전화 버튼(`tel:112`)이 보여요. 화면마다 CTA는 하나예요. 용어는 GLOSSARY.md를 따라요.

계약: docs/API.md (`POST /api/analyze`). SPEC.md 일정상 11:20–11:50 slice이고, 끝나면 백업 영상을 녹화해요.

## Acceptance criteria

- [ ] 홈에서 텍스트 붙여넣기와 샘플 3개(택배 스미싱, 지인 사칭, 정상 택배)로 판정을 요청할 수 있어요
- [ ] 분석 중 화면이 보인 뒤 판정 화면으로 넘어가요
- [ ] 판정 화면에 위험 등급 배지, 요약, 사기 유형, 의심 신호(인용 포함), 권장 행동이 나와요
- [ ] 매우 위험 판정에서만 112 전화 버튼이 보여요
- [ ] `INVALID_INPUT`·`PAYLOAD_TOO_LARGE` 같은 오류가 오면 사용자에게 알기 쉬운 안내가 나와요
- [ ] Vercel 배포 URL에서 위 흐름이 동작해요
- [ ] 모바일 화면 너비에서 레이아웃이 깨지지 않아요

## Blocked by

None (can start immediately)
