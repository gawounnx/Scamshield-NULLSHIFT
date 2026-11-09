# HACKATHON_HARNESS.md — 5시간 현장 해커톤용 하네스 워크플로우

> 통합본 하네스 엔지니어링 지침 중 **5시간 단기 현장 해커톤**에 맞춘 경량 버전.
> 원칙: **적게 설정하고, 일찍 돌아가는 것을 만들고, 마감 전에 반드시 제출한다.**
>
> - 참여 인원·역할은 매번 다르므로 고정하지 않는다. 아래 `{ }` 값은 당일 채운다.
> - `(제안)` 표시가 붙은 항목은 기본값이다. 통합본과 다르면 통합본을 우선한다.

---

## 0. 핵심 원칙

1. **Walking skeleton 먼저.** 시작 1시간 안에 입력 → 처리 → 출력이 끝까지 이어지는 최소 버전(mock 허용)을 만든다.
2. **스펙은 짧게, 한 번만 잠근다.** 스펙 확정 후 기능 추가는 원칙적으로 금지하고, 추가가 필요하면 다른 기능을 빼서 맞교환한다.
3. **데모가 곧 제품이다.** 심사는 90초 영상과 저장소로 이루어진다. 영상에 나오지 않는 기능은 만들지 않는다.
4. **에이전트는 병렬로, 충돌은 최소로.** 에이전트마다 담당 영역(디렉터리/브랜치)을 분리한다.
5. **Feature freeze 이후엔 버그 수정과 제출 준비만 한다.** freeze는 항상 **마감 2시간 전**이다.
6. **백업 영상을 먼저 확보한다.** skeleton이 돌면 바로 백업 데모 영상을 찍어 두고, 그 뒤에 기능을 쌓는다.

---

## 1. 대회 규정 체크 (이 행사 기준)

| 항목 | 내용 |
|---|---|
| 빌드 시작 | 오전 10:00 — **그 전에 커밋이 있는 저장소는 참가 불가** |
| 사전 허용 | 브레인스토밍(아이디어 구상)만 |
| 제출물 | 90초 데모 영상(Loom 또는 YouTube) + GitHub 저장소 URL |
| 진행 언어 | 영어 (README, 영상 나레이션 포함) |
| 제출 마감 | `{ 현장 공지 확인 → HH:MM }` — Luma 공식 일정상 빌드 10:00~15:00, 15:00부터 심사. **명시된 마감이 없으므로 15:00 이전 제출을 기본 가정**하고 현장에서 확인 |

**전날/시작 전 금지:** `git init`, 저장소 생성 후 커밋, 코드 작성, 템플릿 프로젝트 push.
**시작 전 허용:** 아이디어 메모, 역할 분담 논의, 기술 스택 후보 정리, 스킬/도구 다운로드(저장소 밖 폴더).

---

## 2. D-1 사전 준비 (저장소 만들기 전)

### 2-1. 기획 (데스크톱 Gemini / 데스크톱 Claude에서)

기획 단계는 원래 워크플로우대로 데스크톱 앱에서 진행한다. 해커톤용으로는 **전날 1단계만**, 나머지는 당일 압축 진행한다.

| 단계 | 시점 | 산출물 |
|---|---|---|
| `/brainstorming` 아이디어 브레인스토밍 | **전날** | 후보 아이디어 2~3개, 각 한 문장 pitch(영어) |
| `/grill-with-docs` 구체화 | 당일 0:00~0:10 (압축) | 확정 아이디어, 범위, 제외 항목 |
| `/to-spec` 요구사항 명세서 | 당일 0:10~0:15 (압축) | `SPEC.md` (아래 템플릿) |

전날 산출물은 **저장소 밖 로컬 메모**에만 둔다 (노션, 메모 앱 등).

### 2-2. 환경·계정

- [ ] Luma QR 준비 (앱 로그인 + QR 스크린샷)
- [ ] GitHub 로그인, Loom/YouTube 로그인, 화면 녹화·마이크 권한 허용
- [ ] AI 에이전트 로그인 확인: **Claude Code, Codex** (Antigravity는 쓸 때만)
- [ ] **Gemini API 키** 발급·호출 테스트·쿼터 확인 (`.env`에만 보관, 커밋 금지). 오류(503 등) 시 재시도 → 경량 모델(flash-lite) 폴백을 쓸 예정임을 인지
- [ ] 런타임 버전 확인 (Node, Python, Docker 등)
- [ ] 모델, Docker 이미지, 패키지, 데이터셋 **로컬 선다운로드** (현장 네트워크 혼잡 대비)
- [ ] **스킬 설치 리허설 완료** (2-3 참고)
- [ ] 핫스팟 백업, 충전기, 보조배터리, 멀티탭

### 2-3. 스킬 준비 + 설치 리허설 (오늘 밤 반드시)

- 로컬 전역에는 `/find-skills`만 둔다. 필요한 스킬은 **프로젝트 폴더(`.agents`, `.claude`)에만** 넣는다.
- 현장 네트워크가 느릴 수 있으므로, **현장에서 처음 설치를 시도하지 않는다.** 아래를 전날 밤에 끝낸다.
  1. 저장소 밖 `skills-staging/` 폴더에서 §3-1의 설치 명령을 실제로 실행해 본다.
  2. 설치된 스킬이 `.agents`/`.claude` 어디에 생기는지, 에이전트(Claude Code, Codex)가 인식하는지 확인한다.
  3. mattpocock 팩의 `/setup-matt-pocock-skills`를 **해커톤과 무관한 연습용 저장소**에서 한 번 돌려 보고, 건너뛰어도 `/to-spec`·`/to-tickets`가 동작하는지 확인한다. (`/to-spec`은 결과를 이슈 트래커에 발행하는 흐름이라 설정이 필요할 수 있다.) 해커톤 저장소는 10시 이전에 만들지 않는다.
  4. 받아 둔 스킬 파일은 `skills-staging/`에 보관했다가 10시 이후 프로젝트 폴더로 복사한다.
- 스킬 이름과 팩 목록은 2026-11-08에 클라우드 환경에서 `npx skills add <repo> --list`를 실제로 실행해 확인했다 (§3-1의 10개 스킬 모두 존재). **다만 본인 컴퓨터에서 한 확인이 아니다.** 본인 환경에서의 설치·인식 여부는 위 리허설에서 직접 확인해야 하며, 결과가 이 문서와 다르면 문서를 고친다.

---

## 3. 당일 타임라인 (T = 10:00 시작, 총 5시간)

> 공식 일정은 빌드 10:00~15:00(5시간)이다. 현장에서 마감이 다르게 공지되면 다음 규칙으로 조정한다.
> - 늘어난(줄어든) 시간은 **Build 구간에만** 반영한다.
> - **Feature freeze는 마감 2시간 전**(기본값 T+3:00)으로 고정한다.
> - 제출은 마감 20분 전, Buffer는 마감 전 20분을 유지한다.
>
> 점심은 빌드 중 제공된다. (제안) 식사는 에이전트가 돌아가는 동안 교대로 한다.

> **스킬 열은 실제 사용 기준으로 갱신했다 (11/9 12:35).** ✅ 사용함 · ⏳ 남은 단계에서 사용 예정. `/implement`, `/to-tickets`는 모델이 직접 호출할 수 없게 설정된 스킬이라, 에이전트가 SKILL.md를 읽고 그 절차대로 수행했다. 원칙: 이미 받은 스킬을 먼저 쓰고, 받은 스킬에 없는 기능만 gstack으로 한다.

| 시간 | 단계 | 해야 할 일 | 스킬 (실제 사용) | 완료 기준 |
|---|---|---|---|---|
| T+0:00 ~ 0:15 | **Spec lock** | 저장소 생성, `/grill-with-docs` → `/to-spec`으로 SPEC.md 확정 (전날 브레인스토밍 결과 투입) | ✅ `grilling`, `domain-modeling` → SPEC.md(`/to-spec` 형식) | SPEC.md의 Must 2~3개(권장 2개), 데모 시나리오 1개 |
| T+0:15 ~ 0:30 | **Plan & Setup** | 스킬 복사·설치, 작업 분해, 담당 영역 배정, `AGENTS.md`/`CLAUDE.md` 작성 | ✅ `to-tickets` 절차(이슈 #1–#8, `docs/tickets/`), `writing-for-agents`(AGENTS.md) | 작업 목록이 slice 단위(각 20~40분)로 나뉨 |
| T+0:30 ~ 1:00 | **Walking skeleton** | 전체 흐름이 끝까지 이어지는 최소 버전 (mock 허용), 첫 배포/실행 확인 | ✅ `implement` 절차 + `code-review`(API), `frontend-design`(화면), `/gstack-careful` · ⏳ `deploy-to-vercel` | 데모 시나리오가 mock으로라도 1회 통과 |
| T+1:00 ~ 1:10 | **Backup 영상** | skeleton 상태로 30~60초 데모 영상을 녹화해 Loom/YouTube에 업로드 (영어 한두 문장 나레이션, 화질·완성도 무관) | — | 백업 영상 링크 확보, 링크 열림 확인 |
| T+1:10 ~ 3:00 | **Build** | Must 기능을 vertical slice로 하나씩 완성. 완성할 때마다 커밋과 데모 흐름 확인 | ⏳ `implement`, `frontend-design` | Must 전부 실제 동작 |
| **T+3:00** | **Feature freeze** | 새 기능 추가 금지 | — | — |
| T+3:00 ~ 3:30 | **Polish & Fix** | 버그 수정, 오류 처리, UI 정리, 영어 README. (코드 리뷰는 `code-review`, 테스트·버그 수정은 Codex) | ⏳ `code-review`(코드 리뷰), `diagnosing-bugs`, `webapp-testing`(QA) | 데모 시나리오가 3회 연속 통과 |
| T+3:30 ~ 4:15 | **Demo 영상** | 90초 스크립트 작성(영어), 리허설, 녹화(Loom/YouTube), 업로드 | 전용 스킬 없음 (`deploy-to-vercel`로 라이브 링크 확보 가능) | 영상 링크 열림 확인 |
| T+4:15 ~ 4:40 | **제출** | GitHub URL, 영상 링크 제출, 시크릿 노출 점검, 시크릿 창에서 링크 열기. 최종 영상이 문제면 백업 영상으로 대체 | ⏳ `verification-before-completion` | 제출 완료 확인 |
| T+4:40 ~ 5:00 | **Buffer** | 예비 시간 (절대 사용하지 않는 것을 목표로) | — | — |

### 3-1. 스킬 (5시간용 최소 세트, 10개 이내)

> 5시간 동안은 스킬을 늘릴수록 에이전트가 헷갈리고 설치 시간만 든다. **아래 10개로 충분하다.** 그 밖의 스킬은 설치하지 않는다.
> `claude-api`는 Claude API를 쓰지 않으므로 제외했다. Gemini 연동용으로 검증한 전용 스킬은 없으므로 공식 문서/SDK를 에이전트에게 참고시킨다.

| 스킬 | 팩 | 쓰는 단계 | 하는 일 |
|---|---|---|---|
| `grill-with-docs` | mattpocock | Spec lock | 계획을 질문으로 집요하게 검증하면서 용어집(`CONTEXT.md`)과 결정 기록(ADR)을 갱신 |
| `to-spec` | mattpocock | Spec lock | 지금까지의 논의를 스펙 문서로 정리 |
| `to-tickets` | mattpocock | Plan | 스펙을 의존 관계가 있는 얇은 작업(ticket)으로 분해 |
| `writing-for-agents` | mattpocock | Plan | `AGENTS.md`/`CLAUDE.md`처럼 에이전트가 읽는 문서 작성 가이드 |
| `implement` | mattpocock | Skeleton, Build | 스펙/ticket을 기준으로 구현 |
| `frontend-design` | anthropics | Skeleton, Build | 밋밋한 AI 기본 스타일을 피하는 프론트엔드 디자인 |
| `diagnosing-bugs` | mattpocock | Polish | 어려운 버그를 구조적으로 추적하고 회귀 테스트로 마무리 |
| `webapp-testing` | anthropics | Polish | Playwright로 로컬 웹앱 UI 동작 검증 |
| `verification-before-completion` | superpowers | 제출 | "완료"라고 말하기 전에 실제 동작을 확인 |
| `deploy-to-vercel` | vercel-labs | Skeleton, Demo | 웹앱을 Vercel에 배포해 라이브 링크 확보 (**웹 배포할 때만**) |

**추가로 쓰는 gstack 스킬 (위 10개에 없는 기능만)**

| 스킬 | 쓰는 단계 | 하는 일 |
|---|---|---|
| `/gstack-careful` | Skeleton~Build | 2명이 같은 저장소에서 작업할 때 파일 삭제·force-push 같은 위험 명령 경고 |

코드 리뷰는 이미 받은 `code-review`, QA는 `webapp-testing`으로 하므로 `/gstack-review`, `/gstack-qa`는 쓰지 않는다. 앞으로도 받은 스킬에 없는 기능이 필요할 때만 gstack을 쓴다. gstack은 각자 `~/.claude/skills`에 `./setup --prefix`로 설치하며 저장소에는 넣지 않는다.

**설치 (오늘 밤 `skills-staging/`에서 리허설, 10시 이후 프로젝트 폴더로 복사)**

```bash
npx skills@latest add mattpocock/skills --skill grill-with-docs --skill to-spec --skill to-tickets --skill writing-for-agents --skill implement --skill diagnosing-bugs
npx skills@latest add anthropics/skills --skill frontend-design --skill webapp-testing
npx skills@latest add obra/superpowers --skill verification-before-completion
npx skills@latest add vercel-labs/agent-skills --skill deploy-to-vercel   # 웹 배포 시에만
```

- 위 4개 저장소의 접근과 스킬 이름은 2026-11-08에 클라우드 환경에서 `--list`로 확인했다. **실제 설치(`--skill` 여러 개 지정 포함)와 본인 컴퓨터에서의 동작은 확인하지 못했으니 오늘 밤 리허설에서 반드시 실행한다.** 플래그가 안 먹으면 스킬마다 한 번씩 실행한다.
- 같은 팩을 플러그인 방식과 `npx skills`로 **둘 다** 설치하면 스킬이 중복된다. 한 방식만 쓴다.
- 이 목록에 없는 스킬이 필요해 보이면 `find-skills`에서 **정확한 이름 + 팩 이름**으로 검색하거나, 저장소를 직접 지정해서 설치한다.

**규칙:** 어떤 단계든 시간 초과 시 다음 단계를 침범하지 말고 **범위를 줄여서** 일정을 지킨다.

---

## 4. 인원·역할 템플릿 (당일 인원에 맞춰 선택)

### 솔로
- 한 사람이 PM+개발+데모를 모두 맡는다. 에이전트 병렬은 **서로 다른 디렉터리**에서만 허용한다.
- Build 구간을 `프론트 slice` ↔ `백엔드 slice`로 번갈아 돌린다.

### 2인
- **A (Backend/AI 로직)**, **B (Frontend/데모)**. 인터페이스(API 스키마)를 T+0:30 안에 먼저 합의한다.
- 데모 영상과 README는 B가 주도하고, A가 기술 설명을 검수한다.

### 3~4인
- Backend/AI, Frontend, Integration·배포, Pitch·데모·README(코드 비중 낮음) 중 역할을 나눈다.
- 통합 담당 1명이 `main` 병합을 책임진다. 나머지는 브랜치에서 작업한다.

---

## 5. 에이전트 운용 규칙 (Claude Code / Codex)

(제안) 역할 분담 기본값 — **2개 에이전트 구성**:

| 에이전트 | 추천 용도 |
|---|---|
| Claude Code | 구현(핵심 로직·UI), 작업 분해, 리팩터링 |
| Codex | 리뷰, 테스트, 버그 수정, 배포 설정 등 Claude Code가 커밋한 slice를 검증·보완하는 작업 |
| (선택) Antigravity | 쓰기로 했다면 UI slice·브라우저 검증 전담. 안 쓰면 생략 |

공통 규칙:

1. **한 에이전트 = 한 영역.** 같은 파일을 두 에이전트가 동시에 수정하지 않는다. Codex의 리뷰·수정은 **Claude Code가 해당 slice를 커밋한 뒤**에 시작한다.
2. **작게, 자주 커밋.** 한 slice 완료 = 1커밋. 메시지는 짧게.
3. **지시문은 짧게 유지.** `AGENTS.md`/`CLAUDE.md`는 한 화면 분량(스택, 실행 명령, 디렉터리 구조, 금지 사항)만.
4. **스펙 우선.** 에이전트에게 항상 `SPEC.md`를 먼저 읽게 하고, 스펙에 없는 기능은 만들지 않게 한다.
5. **에이전트가 막히면 15분 룰.** 15분 안에 진전이 없으면 접근을 바꾸거나 mock/하드코딩으로 우회한다.
6. **시크릿 금지.** API 키는 `.env`, `.gitignore`에 `.env` 포함 여부를 최초 커밋 전에 확인한다.
7. **LLM 호출은 오류에 강하게.** Gemini 503/쿼터 오류 시 재시도(백오프) 후 경량 모델(flash-lite)로 폴백하도록 처음 호출 코드부터 넣는다.

### `AGENTS.md` / `CLAUDE.md` 최소 템플릿

```md
# Project: {이름}
## Goal (1줄)
{한 문장}
## Stack
{프론트/백엔드/DB}, LLM: Gemini ({모델명}, 폴백: flash-lite)
## Run
{설치·실행·테스트 명령}
## Structure
{주요 디렉터리와 담당}
## Rules
- SPEC.md의 Must만 구현한다. 범위 외 기능 금지.
- 작은 단위로 커밋한다. .env와 키는 절대 커밋하지 않는다.
- 막히면 mock/하드코딩으로 우회하고 TODO로 남긴다.
- Gemini 호출은 503/쿼터 오류 시 재시도 후 flash-lite로 폴백한다.
```

> **지시문은 `AGENTS.md` 하나만 관리한다.** Claude Code는 `CLAUDE.md`, Codex는 `AGENTS.md`를 읽으므로, 내용은 `AGENTS.md`에만 쓰고 `CLAUDE.md`에는 `@AGENTS.md` 한 줄만 넣는다. 그러면 두 파일이 어긋나지 않는다. (오늘 밤 리허설에서 Claude Code가 `@AGENTS.md` 내용을 실제로 읽는지 한 번 확인한다.)

---

## 6. SPEC.md 미니 템플릿 (해커톤용)

```md
# {프로젝트명}
## One-liner (EN)
{한 문장 pitch}
## Problem / User
{누구의 어떤 문제}
## Demo scenario (90초)
1. {장면 1}  2. {장면 2}  3. {장면 3}
## Must (권장 2개, 최대 3개)
- [ ] 
## Should (시간이 남으면)
- [ ] 
## Won't (명시적 제외)
- 
## Tech
{스택, 외부 API, 모델} — LLM: Gemini ({모델명})
## Risks / Fallback
- Gemini 503/쿼터 오류: 재시도(백오프) 후 flash-lite로 폴백, 그래도 실패하면 캐시/mock 응답으로 데모 진행
- {가장 위험한 부분과 mock 대체안}
```

---

## 7. Scope 컷 규칙 (일정이 밀릴 때)

| 상황 | 대응 |
|---|---|
| T+0:10까지 `/grill-with-docs`가 안 끝남 | **grill을 중단**하고 §6 템플릿을 손으로 채워 SPEC.md를 확정한다 (Spec lock은 15분이 한도) |
| T+1:00까지 skeleton이 안 돎 | Must를 1개로 줄이고 mock 적극 활용 |
| T+1:10까지 백업 영상이 없음 | 다른 작업보다 먼저 mock 상태로라도 30초 영상을 찍는다 |
| T+2:30에 Must 절반 미만 | 가장 약한 Must 제거, 남은 기능에 집중 |
| T+3:00 freeze 시점에 미완 기능 | 데모 흐름에서 빼고 README의 "Future work"로 이동 |
| Gemini 503/쿼터 오류가 반복됨 | 재시도 → flash-lite 폴백 → 캐시된 응답/mock으로 데모 구성 |
| 배포 실패 | 로컬 실행 + 화면 녹화로 데모 대체 |
| 최종 데모 영상 제작 실패 | 백업 영상으로 제출 |
| 에이전트 한도/네트워크 문제 | 핫스팟 전환, 다른 에이전트로 교대 |

---

## 8. 데모 영상·제출 체크리스트

**90초 영상 구조 (영어)**
- 0:00~0:10 문제와 대상 사용자 (1~2문장)
- 0:10~1:10 라이브 데모 (SPEC의 데모 시나리오 그대로)
- 1:10~1:30 기술 구성 한 줄과 임팩트 한 줄

**제출 전 점검**
- [ ] 백업 영상 링크가 이미 확보되어 있음 (T+1:10)
- [ ] 영상 90초 이내, 소리 정상, 링크가 **로그아웃/시크릿 창**에서 열림
- [ ] GitHub 저장소 public(또는 심사 가능 상태), README에 한 줄 소개·실행 방법·데모 링크 포함 (영어)
- [ ] 첫 커밋 시각이 **10:00 이후**인지 확인
- [ ] `.env`, API 키가 커밋 이력에 없음
- [ ] 제출 폼/플랫폼에 두 링크 입력 후 제출 완료 화면 확인

---

## 9. 에이전트에게 쓰는 프롬프트 스니펫

**Slice 시작 (Claude Code)**
```
SPEC.md와 AGENTS.md를 읽고, "{slice 이름}"만 구현해줘.
담당 영역은 {디렉터리}. 다른 영역은 수정하지 마.
끝나면 실행 방법과 확인 결과를 3줄로 요약하고 커밋해줘.
```

**Slice 검증 (Codex)**
```
방금 커밋된 "{slice 이름}"을 SPEC.md의 Must 기준으로 리뷰하고 테스트해줘.
깨지는 부분만 최소 수정으로 고치고, 고친 내용을 3줄로 요약해줘. 새 기능은 추가하지 마.
```

**막혔을 때**
```
15분 넘게 해결이 안 돼. 완벽한 구현은 포기하고 데모 시나리오가 통과하는
가장 단순한 우회안(mock/하드코딩)을 제안하고 적용해줘. 제거한 부분은 TODO로 남겨.
```

**Freeze 이후 정리**
```
기능 추가 없이, 데모 시나리오 3회 반복 시 깨지는 부분만 찾아서 고쳐줘.
영어 README(소개, 실행 방법, 데모 링크 자리)도 작성해줘.
```
