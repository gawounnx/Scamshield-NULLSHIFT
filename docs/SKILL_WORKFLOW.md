# gstack 사용 계획 (c0mpiled-17 Seoul)

> **기준 문서는 [HACKATHON_HARNESS.md](../HACKATHON_HARNESS.md)다.** 이 문서는 하네스 일정 위에 gstack을 어디에 끼워 넣는지만 정한다.
> gstack 명령은 모두 `/gstack-` 접두어로 입력한다. (설치 시 `./setup --prefix`)

## 결정 (11:20 기준)

일정이 약 1시간 밀려서, gstack 계획 리뷰는 대부분 생략하고 **구현 이후 검증 단계에 집중**한다. SPEC.md는 이미 확정됐으므로 범위를 다시 흔들지 않는다.

| gstack 스킬 | 사용 | 시점 | 이유 |
|---|---|---|---|
| `/gstack-plan-ceo-review` | ❌ | — | SPEC.md에서 Must 2개로 이미 범위 확정 |
| `/gstack-plan-eng-review` | 선택 | 구현 직전, **10분 제한** | 아키텍처·데이터 흐름·Gemini 오류 처리만 점검. 스펙 범위는 바꾸지 않음 |
| `/gstack-plan-design-review` | ❌ | — | 하네스의 `frontend-design`으로 대체 |
| `/gstack-careful` | ✅ | 구현 시작 시 | 2명이 같은 레포 작업 → 파일 삭제·force-push 경고 |
| `/gstack-review` | ✅ | Feature freeze 이후 | 머지 전 코드 리뷰 |
| `/gstack-qa` | ✅ | Feature freeze 이후 | 실제 브라우저로 데모 시나리오 테스트 + 버그 수정 |
| `/gstack-ship` | 선택 | 마지막 | 브랜치/PR 방식일 때만. 배포는 하네스의 `deploy-to-vercel` |

## 하네스 일정과 합친 순서

1. 준비: 루트 `.gitignore`, 역할 분담(A 백엔드/AI, B 프론트/데모)
2. (선택) `/gstack-plan-eng-review` 10분
3. `/to-tickets` → `/implement`로 walking skeleton (mock 허용) → `deploy-to-vercel` → 백업 영상
4. Must(M1 판정, M2 보호자 연결) 구현, slice마다 커밋 + Codex 리뷰
5. **Feature freeze** (마감 2시간 전)
6. `/gstack-review` → `/gstack-qa` (결과 화면 캡처 → GStack 특별상 근거)
7. 영어 README, 90초 데모 영상, 제출

## gstack 설치 (각자 노트북, 레포에는 커밋하지 않음)

```bash
curl -fsSL https://bun.sh/install | bash && source ~/.zshrc
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --prefix   # --prefix 필수: /gstack- 접두어로 설치
```
