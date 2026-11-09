"""ScamShield demo flow (#6): onboarding -> 4 samples -> screenshot -> validation -> reload.

Usage: python3 tests/e2e/demo_flow.py <base-url> [screenshot-dir]
  Needs `pip install playwright && playwright install chromium`.
  Locally, run against `next start` with ANALYZE_ALLOW_MOCK=1 so no Gemini quota is used.
  Screenshots go to a temp folder unless a directory is given; they are never committed.
  Set PLAYWRIGHT_CHROMIUM_PATH to reuse an already-installed Chromium.
"""
import os, re, sys, base64, tempfile
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1].rstrip("/")
OUT = sys.argv[2] if len(sys.argv) > 2 else tempfile.mkdtemp(prefix="scamshield-e2e-")
os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get("PLAYWRIGHT_CHROMIUM_PATH")
RANK = {"안전": 0, "주의": 1, "위험": 2, "매우 위험": 3}
EXPECT = [  # (sample title, minimum level, maximum level) — SPEC smoke-test ranges
    ("택배 주소를 고치라는 문자", "위험", "매우 위험"),
    ("폰이 깨졌다는 자녀의 문자", "위험", "매우 위험"),
    ("영어로 온 계좌 잠금 문자", "위험", "매우 위험"),
    ("배송 예정 안내 문자", "안전", "안전"),
]
results, errors, verdict_calls = [], [], []

def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + (f" — {detail}" if detail else ""), flush=True)

def level(page):
    seal = page.locator('[aria-label^="위험 등급:"]')
    seal.wait_for(timeout=45000)
    return seal.get_attribute("aria-label").split(": ", 1)[1]

def check_verdict(page, label, lo, hi, tag):
    lv = level(page)
    check(f"{label}: 등급 {lo}~{hi}", RANK[lo] <= RANK[lv] <= RANK[hi], lv)
    summary = page.locator("h1").inner_text()
    check(f"{label}: 요약이 한국어", bool(re.search(r"[가-힣]", summary)), summary[:50])
    has112 = page.locator('a[href="tel:112"]').count() > 0
    if lv == "매우 위험":
        check(f"{label}: 112 버튼 있음", has112)
    else:
        check(f"{label}: 112 버튼 없음", not has112)
    guardian = page.get_by_role("button", name="큰아들에게 알리기").count() > 0
    check(f"{label}: 보호자 알리기 {'있음' if RANK[lv] >= 2 else '없음'}", guardian == (RANK[lv] >= 2))
    if guardian:  # demo scenario 3: guardian alert sits above the recommended-action list
        btn_y = page.get_by_role("button", name="큰아들에게 알리기").bounding_box()["y"]
        list_y = page.get_by_role("heading", name="권장 행동").bounding_box()["y"]
        check(f"{label}: 보호자 알리기가 권장 행동 목록보다 위", btn_y < list_y)
    page.screenshot(path=f"{OUT}/{tag}.png", full_page=True)
    return lv

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, **({"executable_path": CHROME} if CHROME else {}))
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="ko-KR", reduced_motion="reduce")
    page = ctx.new_page()
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("response", lambda r: r.url.endswith("/api/analyze") and r.request.method == "POST" and verdict_calls.append(r.status))

    page.goto(BASE); page.wait_for_load_state("networkidle")
    expect(page.get_by_text("나이를 알려 주세요")).to_be_visible()
    page.get_by_role("button", name="19세 미만").click()
    check("19세 미만: 보호자 없이 시작 불가", page.get_by_role("button", name="나중에 할게요").count() == 0
          and page.get_by_role("button", name="보호자 지정하고 시작하기").is_disabled())
    page.get_by_role("button", name="나이 다시 고르기").click()
    page.get_by_role("button", name="60세 이상").click()
    page.get_by_label("이름").fill("큰아들")
    page.get_by_label("전화번호").fill("010-1234-5678")
    page.get_by_role("button", name="보호자 지정하고 시작하기").click()
    expect(page.get_by_text("사기일까요?")).to_be_visible()
    check("온보딩 완료 후 홈", True)
    titles = page.locator("#samples ~ ul li button span.font-bold").all_inner_texts()
    check("샘플 4개, 영어 샘플이 정상 배송 바로 앞", titles == [t for t, _, _ in EXPECT], " / ".join(titles))

    for i, (title, lo, hi) in enumerate(EXPECT, 1):
        page.get_by_role("button", name=re.compile(re.escape(title))).click()
        expect(page.get_by_text("판정하고 있어요")).to_be_visible()
        check_verdict(page, title, lo, hi, f"{i}-sample")
        page.get_by_role("button", name="다른 메시지 확인하기").click()
        expect(page.get_by_text("사기일까요?")).to_be_visible()

    # Screenshot upload: draw the smishing text into a PNG in the browser.
    png_b64 = page.evaluate("""() => {
      const c = document.createElement('canvas'); c.width = 900; c.height = 420;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 420);
      g.fillStyle = '#e6eaec'; g.fillRect(30, 40, 840, 330); g.fillStyle = '#111'; g.font = '30px sans-serif';
      ['[Web발신] 고객님의 택배가 주소지 불일치로', '보관 중입니다. 오늘 안에 주소를 수정하지', '않으면 반송됩니다.', 'https://cj-logistics-kr.top/a8Fk2']
        .forEach((t, i) => g.fillText(t, 60, 110 + i * 65));
      return c.toDataURL('image/png').split(',')[1];
    }""")
    page.locator("input[type=file]").set_input_files({"name": "sms.png", "mimeType": "image/png", "buffer": base64.b64decode(png_b64)})
    check_verdict(page, "스크린샷(택배 스미싱)", "위험", "매우 위험", "5-screenshot")
    page.get_by_role("button", name="처음으로").click()

    # Validation errors (no model call).
    r = page.request.post(f"{BASE}/api/analyze", data={"locale": "ko-KR"})
    check("API: text·image 없으면 400 INVALID_INPUT", r.status == 400 and r.json()["error"]["code"] == "INVALID_INPUT", str(r.status))
    r = page.request.post(f"{BASE}/api/analyze", data={"text": "가" * 5001, "locale": "ko-KR"})
    check("API: 5,001자면 413 PAYLOAD_TOO_LARGE", r.status == 413 and r.json()["error"]["code"] == "PAYLOAD_TOO_LARGE", str(r.status))

    page.reload(); page.wait_for_load_state("networkidle")
    check("새로고침 후 프로필 유지(온보딩 생략)", page.get_by_text("사기일까요?").is_visible())
    check("콘솔 오류 없음", not errors, "; ".join(errors)[:300])
    browser.close()

fails = [r for r in results if not r[1]]
print(f"\n{len(results) - len(fails)}/{len(results)} passed, verdict calls: {len(verdict_calls)} {verdict_calls}, screenshots: {OUT}")
sys.exit(1 if fails else 0)
