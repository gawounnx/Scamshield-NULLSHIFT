# 스미싱 샘플 수집

실제 사기 문자 스크린샷 20~30장 + 정상 문자 10장 정도를 모아요. 프롬프트 테스트, 데모, 발표 사례에 모두 써요.

## 폴더
- `scam/` : 사기 문자 스크린샷
- `legit/` : 정상 문자 스크린샷 (정상 택배 알림, 인증번호, 은행 공지 등)

## 파일 이름
`유형_번호.png` 예: `institution_01.png`, `acquaintance_02.png`, `legit_01.png`
유형은 GLOSSARY의 사기 유형을 따라요: institution, financial, acquaintance, investment, romance, loan, other

## 꼭 지킬 것
- 개인정보(실명, 전화번호, 계좌번호)는 가리고 저장해요.
- 이 폴더의 이미지는 **저장소에 커밋하지 않아요.** `.gitignore`에 넣어 뒀어요. 데모에 쓸 4~5장만 골라서 따로 올려요.

## 데모 필수 샘플 (SPEC 데모 시나리오)
1. 택배 스미싱 (링크 포함) → 기대: CRITICAL/DANGER, INSTITUTION
2. 링크 없는 지인 사칭 ("엄마 나 폰 깨졌어…") → 기대: DANGER 이상, ACQUAINTANCE
3. 영어/베트남어 계정 잠금 문자 → 기대: DANGER 이상
4. 정상 택배 알림 → 기대: SAFE
