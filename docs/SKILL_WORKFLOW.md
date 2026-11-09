# gstack 사용 계획 (c0mpiled-17 Seoul)

> **기준 문서는 [HACKATHON_HARNESS.md](../HACKATHON_HARNESS.md)다.** 스킬별 실제 사용 현황은 하네스 §3 타임라인 표에 있다.
> 원칙: **이미 받은 스킬을 먼저 쓰고, 받은 스킬에 없는 기능만 gstack으로 한다.** gstack은 제품 기능이 아니라 개발 도구다.

## gstack 스킬별 결정

| gstack 스킬 | 사용 | 이유 |
|---|---|---|
| `/gstack-careful` | ✅ 사용 중 | 위험 명령 경고. 받은 스킬에 없음 |
| `/gstack-review` | ❌ | `code-review`로 대체 |
| `/gstack-qa` | ❌ | `webapp-testing`으로 대체 |
| `/gstack-office-hours`, `/gstack-spec` | ❌ | `grilling`, `domain-modeling`, `to-spec`으로 대체 |
| `/gstack-plan-ceo-review`, `/gstack-plan-eng-review` | ❌ | SPEC.md 확정 후 범위 고정, 시간 부족 |
| `/gstack-plan-design-review` | ❌ | `frontend-design`으로 대체 |
| `/gstack-ship` | ❌ | 배포는 `deploy-to-vercel` |

받은 스킬에 없는 기능이 새로 필요해지면 그때 해당 gstack 스킬을 쓰고 이 표에 추가한다. gstack을 쓴 장면은 캡처해 두고 README와 발표에 넣는다(GStack 특별상 근거).

## gstack 설치 (각자 노트북, 저장소에는 커밋하지 않음)

```bash
curl -fsSL https://bun.sh/install | bash && source ~/.zshrc
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --prefix   # --prefix 필수: /gstack- 접두어로 설치
```
