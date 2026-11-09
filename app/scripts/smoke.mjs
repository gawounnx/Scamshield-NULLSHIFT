// Manual smoke test for POST /api/analyze against a RUNNING server (ticket #3).
//
//   1) cd app && npm run dev          (needs GEMINI_API_KEY in app/.env.local)
//   2) node scripts/smoke.mjs         (BASE_URL=https://<deploy>.vercel.app to test a deployment)
//
// Uses ~7 requests; the free Flash-Lite tier allows 15 per minute. Run it by hand, not in CI.
// Message texts come from ../samples/demo.json. Texts are only sent to the server you point at.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const RANK = { SAFE: 0, CAUTION: 1, DANGER: 2, CRITICAL: 3 };
const HANGUL = /[가-힣]/;

let demo;
try {
  demo = JSON.parse(readFileSync(fileURLToPath(new URL("../../samples/demo.json", import.meta.url)), "utf8"));
} catch (error) {
  console.error("samples/demo.json을 읽지 못했어요:", error.message);
  process.exit(2);
}
const byId = Object.fromEntries(demo.samples.map((s) => [s.id, s]));
const need = (id) => {
  if (!byId[id]) throw new Error(`samples/demo.json에 ${id}가 없어요`);
  return byId[id];
};

// Canary: no link and no family wording, so the mock server answers SAFE.
// A real model must flag it. If this comes back SAFE, the server is probably in mock mode.
const CANARY_TEXT = "OO세무서입니다. 미환급 세금 80만원 있습니다. 세금 환급을 위해 신분증, 계좌번호를 보내주세요.";

const cases = [
  { name: "택배 스미싱 (ko)", text: need("demo-1-parcel-smishing").text, locale: "ko-KR", min: "DANGER", type: "INSTITUTION" },
  { name: "지인 사칭, 링크 없음 (ko)", text: need("demo-2-acquaintance-no-link").text, locale: "ko-KR", min: "DANGER", type: "ACQUAINTANCE" },
  { name: "영어 계정 잠금 → ko-KR", text: need("demo-3a-english-account-lock").text, locale: "ko-KR", min: "DANGER", language: "ko" },
  { name: "영어 계정 잠금 → en-US", text: need("demo-3a-english-account-lock").text, locale: "en-US", min: "DANGER", language: "en" },
  { name: "베트남어 계정 잠금 → ko-KR", text: need("demo-3b-vietnamese-account-lock").text, locale: "ko-KR", min: "DANGER", language: "ko" },
  { name: "정상 택배 (ko)", text: need("demo-4-legit-parcel").text, locale: "ko-KR", max: "SAFE", nullType: true },
  { name: "카나리아: 링크 없는 세무서 사칭", text: CANARY_TEXT, locale: "ko-KR", min: "DANGER", canary: true },
];

const squash = (s) => s.replace(/\s+/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(c) {
  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: c.text, locale: c.locale }),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

function judge(c, { status, body }) {
  const fails = [];
  const warns = [];
  if (status !== 200 || !body?.riskLevel) {
    fails.push(`HTTP ${status} ${body?.error?.code ?? ""}`.trim());
    return { fails, warns };
  }
  const rank = RANK[body.riskLevel];
  if (c.min && rank < RANK[c.min]) fails.push(`위험 등급 ${body.riskLevel} < ${c.min}`);
  if (c.max && rank > RANK[c.max]) fails.push(`위험 등급 ${body.riskLevel} > ${c.max}`);
  if (c.type && body.scamType !== c.type) fails.push(`사기 유형 ${body.scamType} ≠ ${c.type}`);
  if (c.nullType && body.scamType !== null) fails.push(`SAFE인데 scamType=${body.scamType}`);
  const actions = (body.recommendedActions ?? []).map((a) => a.type);
  if (rank >= 2 && !actions.includes("ALERT_GUARDIAN")) fails.push("ALERT_GUARDIAN 없음");
  if (rank === 3 && !actions.includes("CALL_112")) fails.push("CALL_112 없음");
  if (c.language === "ko" && !HANGUL.test(body.summary)) fails.push("summary가 한국어가 아님");
  if (c.language === "en" && HANGUL.test(body.summary)) fails.push("summary에 한글이 섞임 (en-US 요청)");
  if (rank >= 1) {
    const flags = body.redFlags ?? [];
    if (flags.length === 0) warns.push("의심 신호 없음");
    const notQuoted = flags.filter((f) => !squash(c.text).includes(squash(f.evidence ?? "")));
    if (notQuoted.length) warns.push(`원문에 없는 evidence ${notQuoted.length}건`);
  }
  return { fails, warns };
}

let failed = 0;
let canaryFailed = false;
console.log(`대상: ${BASE_URL}\n`);
for (const c of cases) {
  let result;
  try {
    result = await call(c);
  } catch (error) {
    console.log(`FAIL  ${c.name}\n      서버에 연결하지 못했어요 (${error.cause?.code ?? error.message}). npm run dev가 켜져 있나요?`);
    process.exit(1);
  }
  const { fails, warns } = judge(c, result);
  const b = result.body ?? {};
  const head = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  console.log(`${head}  ${c.name}  →  ${b.riskLevel ?? "-"} / ${b.scamType ?? "null"}`);
  if (b.summary) console.log(`      요약: ${b.summary}`);
  for (const f of fails) console.log(`      ✗ ${f}`);
  for (const w of warns) console.log(`      ! ${w}`);
  if (fails.length) {
    failed++;
    if (c.canary) canaryFailed = true;
  }
  await sleep(1200);
}

console.log("");
if (canaryFailed) {
  console.log("⚠ 카나리아가 실패했어요. 서버가 mock 모드(GEMINI_API_KEY 없음)이거나 모델이 틀린 거예요.");
  console.log("  이 상태의 다른 PASS는 실제 Gemini 결과가 아닐 수 있어요.");
}
console.log(failed ? `실패 ${failed}건 / 전체 ${cases.length}건` : `전체 ${cases.length}건 통과`);
process.exit(failed ? 1 : 0);
