# 02: [M1·가원] 스크린샷 판정

**GitHub:** [#2](https://github.com/gawounnx/Scamshield-NULLSHIFT/issues/2)

**담당:** 차가원 (프론트: 화면, M2 보호자 알림, 배포, 영상)

## What to build

사용자가 홈에서 의심 메시지의 스크린샷을 고르면 판정 화면이 나와요. 복사가 안 되는 카톡이나 DM도 확인할 수 있게 하는 slice예요(User Story 1). 이미지는 클라이언트에서 긴 변 1600px 이하 JPEG로 줄여서 base64로 보내요(요청 본문 4.5MB 한도). 텍스트와 이미지를 같이 보내도 돼요.

## Acceptance criteria

- [ ] 홈에서 스크린샷을 골라 판정을 요청할 수 있어요
- [ ] 큰 스크린샷(예: 4000px PNG)도 줄여서 보내고 413 없이 판정이 나와요
- [ ] 지원하지 않는 파일 형식이면 알기 쉬운 안내가 나와요
- [ ] 이미지는 서버나 기기에 저장되지 않아요

## Blocked by

- #1
