# Hackathon Project Workspace

> 🚨 **규정 확인 (중요)**
> - **오전 10:00 이전에는 `git init` 및 커밋 생성이 엄격히 금지됩니다.**
> - 오전 10:00 정각에 이 폴더(`project/`)에서 `git init`을 실행하고 시작하세요.
>
> ```bash
> cd project
> git init
> ```

## 준비된 파일 안내
- `SPEC.md` : 10:00 ~ 10:15에 확정할 요구사항 및 90초 데모 시나리오 명세서
- `AGENTS.md` : Claude Code 및 Codex를 위한 프로젝트 규칙 및 지침
- `CLAUDE.md` : Claude Code가 AGENTS.md를 자동으로 읽도록 링크 (`@AGENTS.md`)
- `.gitignore` : API 키(`.env`) 및 무거운 라이브러리 커밋 방지
- `.agents/` / `.claude/` : `skills-staging/`에서 미리 받아둔 스킬이 복사될 위치
