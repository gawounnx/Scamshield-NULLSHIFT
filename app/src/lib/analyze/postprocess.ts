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

// TODO: labels follow the request locale once Gemini is wired in; these are Korean fallbacks.
const FALLBACK_LABELS: Partial<Record<ActionType, string>> = {
  ALERT_GUARDIAN: "보호자에게 알리기",
  CALL_112: "112에 전화하기",
};

// SPEC.md post-processing rules, enforced regardless of what the model returned:
// 1. DANGER or above → ALERT_GUARDIAN present
// 2. CRITICAL → CALL_112 present
// 3. SAFE → scamType null
// 4. No action that tells the user to open a link. ActionType has no such value,
//    so dropping anything outside the enum covers it.
export function enforceVerdictRules(verdict: Verdict): Verdict {
  const actions = verdict.recommendedActions.filter((a) => KNOWN_ACTIONS.has(a.type));
  const has = (type: ActionType) => actions.some((a) => a.type === type);
  const add = (type: ActionType) => actions.push({ type, label: FALLBACK_LABELS[type] ?? type });

  const { riskLevel } = verdict;
  if (riskLevel === "CRITICAL" && !has("CALL_112")) add("CALL_112");
  if ((riskLevel === "DANGER" || riskLevel === "CRITICAL") && !has("ALERT_GUARDIAN")) add("ALERT_GUARDIAN");

  return {
    ...verdict,
    scamType: riskLevel === "SAFE" ? null : verdict.scamType,
    recommendedActions: actions,
  };
}
