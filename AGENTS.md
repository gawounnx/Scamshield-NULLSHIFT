# ScamShield — Agent Instructions

의심 메시지(스크린샷·텍스트)의 판정(위험 등급·사기 유형·의심 신호·권장 행동)과 보호자 알림 공유를 제공하는 웹앱 (`Next.js App Router` + `Tailwind` / `Vercel` / `Gemini Flash-Lite`, S4: `Supabase`).

## Workspace & Environment
- **앱 루트 (`app/`)**: 실제 Next.js 앱은 `app/`(`app/src/app/`, `app/package.json`)에 있다. 설치·실행·빌드·린트·테스트는 `app/`에서 `npm`으로 실행하며, 명령 정의는 `app/package.json`을 단일 출처로 따른다.
- **Next.js 생성 파일 보존**: `app/AGENTS.md`는 `next dev`가 자동 관리하는 Next.js 16 안내 파일이므로 원본 블록을 보존한다.

## Context Pointers (분기별 필독)
- **요구사항·계약·일정 (`SPEC.md`)**: `Must(M1–M2)`/`Should(S1–S4)`/`Won't`, `Verdict` 타입과 후처리 규칙 4개, 프롬프트·연령·보호자 알림 규칙, 테스트 경계, 역할·`13:00` 일정 — 기능 착수, 판정 API/프롬프트 수정, 테스트 작성, 스코프 판단 시 읽는다.
- **도메인 용어 (`GLOSSARY.md`)**: 표준 용어와 금지어(`_Avoid_`) — UI 카피, 프롬프트, 코드 식별자, 문서 작성 시 따른다.
- **Next.js 16 가이드 (`app/AGENTS.md`)**: `app/` 코드 작성 전 `app/node_modules/next/dist/docs/` 문서를 확인한다.

## Scope & Product Invariants
- **Must 우선 · Won't 제외**: `SPEC.md`의 `Must(M1–M2)`를 먼저 동작시킨 뒤 남는 시간에 `Should(S1–S4)`를 위에서부터 진행한다. `Out of Scope(Won't)` 항목은 구현에서 제외한다. 개발 도구 GStack은 이미 받은 스킬에 없는 기능(현재 `/gstack-careful`)에만 선별적으로 쓴다.
- **Feature freeze (`13:00`)**: 마감 2시간 전 이후에는 버그 수정, 안정화, 영어 `README.md`, 데모 준비만 진행한다.
- **원문 비보관**: 서버·DB(S4 익명 판정 기록 포함)·콘솔 출력에는 익명 메타데이터만 남기며, 의심 메시지 원문과 이미지는 저장·출력하지 않는다.
- **정적 URL 검사**: URL 검사는 문자열 파싱과 Safe Browsing 조회로만 수행하며, 추출한 링크를 직접 열거나 페치하지 않는다.
- **사용자 명시 전송**: 보호자 알림은 사용자가 고른 항목으로 공유 창(또는 대체 경로)을 열어 줄 뿐, 사용자 조작 전 자동 발송하지 않는다.
- **안내 문구 한계**: 개인정보 안내는 "원문을 저장하지 않습니다"까지만 표기한다(무료 Gemini 등급이므로 모델 학습 비사용 문구는 쓰지 않는다).

## Engineering & Resilience Rules
- **Gemini 호출 (`Flash-Lite`)**: `Flash-Lite` 무료 키를 단일 주 모델로 구조화 출력(JSON)을 호출한다. `503`/쿼터 초과 시 지수 백오프로 재시도한 뒤 데모 샘플 4개 캐시(또는 mock) 응답으로 폴백한다.
- **계약·후처리 강제**: 판정 엔드포인트는 `SPEC.md`의 `Verdict` 계약을 따르고, LLM 응답과 무관하게 서버 후처리 규칙 4개를 강제한다.
- **테스트 경계**: 테스트는 판정 엔드포인트 입출력(외부 동작), 후처리 규칙, 데모 회귀 경계에만 둔다. 실제 `Flash-Lite` 스모크 테스트는 무료 쿼터 보호를 위해 수동으로만 실행한다.
- **15분 룰**: 동일 이슈가 15분 넘게 진전이 없으면 데모 시나리오가 통과하는 단순 우회안(캐시·mock·하드코딩)으로 전환하고 `// TODO:` 주석을 남긴다.

## Collaboration, Git & Completion Criteria
- **영역 분리 · 1 slice = 1 커밋**: 에이전트별 담당 영역을 분리해 한 번에 한 영역만 수정하고, 한 slice 완료·검증마다 커밋 1개로 남긴다.
- **시크릿·샘플 격리**: API 키와 샘플 이미지는 `.env`와 `samples/`(`.gitignore` 대상)에만 두고, 커밋 전 `git status`로 제외 여부를 확인한다.
- **완료 기준**: 완료 보고 및 커밋 전 ① `app/`에서 `npm run lint` 및 빌드/타입체크(`npm run build` 또는 `npx tsc --noEmit`) 통과, ② 해당 slice 동작/테스트 검증, ③ UI·프롬프트의 `GLOSSARY.md` 용어 일치, ④ `git status` 시크릿 미포함을 모두 확인한다.
