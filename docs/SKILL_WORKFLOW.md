# ScamShield 스킬 사용 순서 (c0mpiled-17 Seoul)

> 원칙: 겹치는 기능은 우리가 이미 쓰는 스킬(grilling, domain-modeling)로 진행하고, gstack은 계획 검토·QA·배포에만 쓴다.
> gstack 명령은 모두 `/gstack-` 접두어로 입력한다.

## 0. 아이디어 구체화 (진행 중)

| 순서 | 스킬 | 목적 | 산출물 |
|---|---|---|---|
| 1 | `grilling` | 타깃·차별점·입력 방식·결과 표현 등 결정 확정 | 결정 목록 |
| 2 | `domain-modeling` | 핵심 용어 정의 (판별 요청, 판정, 의심 신호, 권장 행동 등) | `GLOSSARY.md`, ADR |

→ 산출물 .md를 이 레포에 push

## 1. 계획 검토 (~30분)

| 순서 | 스킬 | 목적 |
|---|---|---|
| 3 | `/gstack-plan-ceo-review` (Reduction 모드) | 5시간 안에 만들 핵심만 남기기 |
| 4 | `/gstack-plan-eng-review` | 아키텍처(Vision LLM + 도메인 조회 + 모바일 웹), 데이터 흐름, 엣지케이스, 테스트 계획 확정 |
| 5 | `/gstack-plan-design-review` | 결과 화면(🔴🟡🟢 + 근거 + 할 일) 점수화 → Polish 확보 |

시간이 부족하면 3~5번을 `/gstack-autoplan` 하나로 대체한다.

## 2. 구현 (~3시간)

| 도구 | 용도 |
|---|---|
| Claude Code | 구현 |
| Codex | 실행 확인, 버그 수정 |
| `/gstack-careful` | 파일 삭제·force-push 같은 위험 명령 경고 (공동 작업 안전장치) |

→ 구현 1시간 안에 최소 기능 버전을 배포하고 Hustle용 사용자 모집 시작

## 3. 검증 및 배포 (~40분)

| 순서 | 스킬 | 목적 |
|---|---|---|
| 6 | `/gstack-review` | 머지 전 코드 리뷰, 실제 서비스에서 터질 버그 찾기 |
| 7 | `/gstack-qa` | 실제 브라우저로 사기 문자 판별 흐름 테스트 + 버그 수정 (데모 리허설 겸용) |
| 8 | `/gstack-ship` | 테스트 → push → PR |

## 4. 발표 준비 (~30분)

- 발표 자료 제작
- gstack 사용 장면(리뷰 점수, QA 결과) 스크린샷 포함 → GStack 특별상 근거

## 사용하지 않는 gstack 스킬

| gstack 스킬 | 대신 쓰는 것 |
|---|---|
| `/gstack-office-hours` | `grilling` |
| `/gstack-spec` | `grilling` + `domain-modeling` |
| `/gstack-learn` | 기존 메모리 기능 |
| `/gstack-codex` | Codex 직접 사용 |

## gstack 설치 (각자 노트북)

```bash
curl -fsSL https://bun.sh/install | bash && source ~/.zshrc
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --prefix   # --prefix 필수: /gstack- 접두어로 설치
```

gstack은 각자의 `~/.claude/skills/`에 설치하며, 이 레포에는 커밋하지 않는다.
