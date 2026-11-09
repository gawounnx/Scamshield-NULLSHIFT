# {프로젝트명}

## One-liner (EN)
{한 문장 pitch}

## Problem / User
{누구의 어떤 문제}

## Demo scenario (90초)
1. {장면 1: 문제 제시 및 메인 화면 진입}
2. {장면 2: 핵심 인터랙션 시연 - 사용자 입력 -> Gemini API 호출 -> 처리 결과 출력}
3. {장면 3: 핵심 가치 확인 및 완료}

## Must (권장 2개, 최대 3개 - Walking Skeleton 대상)
- [ ] Must 1: 
- [ ] Must 2: 
- [ ] Must 3: 

## Should (시간이 남으면)
- [ ] Should 1: 

## Won't (명시적 제외 - 5시간 내 절대 안 만듦)
- 복잡한 사용자 인증/회원가입 (하드코딩 또는 세션 mock 처리)
- 결제 시스템
- 복잡한 DB 스키마 마이그레이션

## Tech
- Frontend: 
- Backend / API: 
- LLM: Gemini 2.5 Flash (폴백: Gemini 2.5 Flash Lite)
- Deploy: Vercel

## Risks / Fallback
- Gemini 503/쿼터 오류: 지수 백오프 재시도 후 flash-lite로 폴백, 그래도 실패하면 캐시/mock 응답으로 데모 진행
- 네트워크 불안정: 로컬 환경 실행 및 백업 데모 영상(T+1:10 녹화본)으로 우회
