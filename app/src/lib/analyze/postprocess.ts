import type { ActionType, Verdict } from "./types";

const KNOWN_ACTIONS: ReadonlySet<ActionType> = new Set([
  "DO_NOT_CLICK",
  "CALL_112",
  "CALL_OFFICIAL",
  "ALERT_GUARDIAN",
  "VERIFY_WITH_PERSON",
  "BLOCK_SENDER",
  "NONE",
]);

// Labels for actions the server adds itself. Korean and English; other locales get English.
const FALLBACK_LABELS: Record<"ko" | "en", Partial<Record<ActionType, string>>> = {
  ko: { ALERT_GUARDIAN: "보호자에게 알리기", CALL_112: "112에 전화하기" },
  en: { ALERT_GUARDIAN: "Alert my guardian", CALL_112: "Call 112 (police)" },
};

// SPEC.md post-processing rules, enforced regardless of what the model returned:
// 1. DANGER or above → ALERT_GUARDIAN present
// 2. CRITICAL → CALL_112 present
// 3. SAFE → scamType null
// 4. No action that tells the user to open a link. ActionType has no such value,
//    so dropping anything outside the enum covers it.
export function enforceVerdictRules(verdict: Verdict, locale = "ko"): Verdict {
  const labels = FALLBACK_LABELS[locale.toLowerCase().startsWith("ko") ? "ko" : "en"];
  const actions = verdict.recommendedActions.filter((a) => KNOWN_ACTIONS.has(a.type));
  const has = (type: ActionType) => actions.some((a) => a.type === type);
  const add = (type: ActionType) => actions.push({ type, label: labels[type] ?? type });

  const { riskLevel } = verdict;
  if (riskLevel === "CRITICAL" && !has("CALL_112")) add("CALL_112");
  if ((riskLevel === "DANGER" || riskLevel === "CRITICAL") && !has("ALERT_GUARDIAN")) add("ALERT_GUARDIAN");

  return {
    ...verdict,
    scamType: riskLevel === "SAFE" ? null : verdict.scamType,
    recommendedActions: actions,
  };
}
