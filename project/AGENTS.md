# Project: {프로젝트명}

## Goal (1줄)
{한 문장 pitch}

## Stack
- Frontend: {프론트엔드 스택}
- Backend: {백엔드 스택}
- LLM: Gemini ({모델명}, 폴백: flash-lite)

## Run
- Install: npm install
- Dev: npm run dev
- Test: npm test

## Structure
- src/components/ : UI 컴포넌트 (Claude Code)
- src/app/ (또는 pages/) : 라우트 및 페이지 UI
- src/api/ (또는 app/api/) : 백엔드 엔드포인트 및 Gemini API 연동 로직
- tests/ : E2E / 단위 테스트 (Codex)

## Rules
- SPEC.md의 Must만 구현한다. 범위 외 기능 금지.
- 한 slice 완료 시마다 1커밋. 작은 단위로 커밋한다.
- .env와 API 키는 절대 커밋하지 않는다 (.gitignore 필수 확인).
- 15분 이상 막히면 mock/하드코딩으로 우회하고 TODO 주석으로 남긴다.
- Gemini 호출은 503/쿼터 오류 시 재시도(지수 백오프) 후 flash-lite로 폴백한다.
- Feature freeze(마감 2시간 전) 이후에는 새 기능을 추가하지 않고 버그 수정과 안정화만 진행한다.
