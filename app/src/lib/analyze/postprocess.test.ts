import { describe, expect, it } from "vitest";
import { enforceVerdictRules } from "./postprocess";
import type { Verdict } from "./types";

// SPEC.md rule tests: a fake model verdict that breaks each rule.
const base: Verdict = {
  riskLevel: "CAUTION",
  scamType: "OTHER",
  summary: "s",
  redFlags: [],
  recommendedActions: [{ type: "DO_NOT_CLICK", label: "링크를 누르지 마세요" }],
  extractedUrls: [],
};
const types = (v: Verdict) => v.recommendedActions.map((a) => a.type);

describe("enforceVerdictRules", () => {
  it("DANGER adds ALERT_GUARDIAN", () => {
    expect(types(enforceVerdictRules({ ...base, riskLevel: "DANGER" }))).toContain("ALERT_GUARDIAN");
  });

  it("CRITICAL adds CALL_112 and ALERT_GUARDIAN", () => {
    const t = types(enforceVerdictRules({ ...base, riskLevel: "CRITICAL" }));
    expect(t).toContain("CALL_112");
    expect(t).toContain("ALERT_GUARDIAN");
  });

  it("does not duplicate an action that is already there", () => {
    const v = enforceVerdictRules({
      ...base,
      riskLevel: "DANGER",
      recommendedActions: [{ type: "ALERT_GUARDIAN", label: "x" }],
    });
    expect(types(v)).toEqual(["ALERT_GUARDIAN"]);
  });

  it("SAFE forces scamType to null", () => {
    expect(enforceVerdictRules({ ...base, riskLevel: "SAFE", scamType: "INSTITUTION" }).scamType).toBeNull();
  });

  it("drops actions outside the enum, such as opening a link", () => {
    const v = enforceVerdictRules({
      ...base,
      recommendedActions: [
        { type: "OPEN_LINK" as never, label: "링크 열기" },
        { type: "BLOCK_SENDER", label: "차단" },
      ],
    });
    expect(types(v)).toEqual(["BLOCK_SENDER"]);
  });

  it("leaves CAUTION actions alone", () => {
    expect(types(enforceVerdictRules(base))).toEqual(["DO_NOT_CLICK"]);
  });
});
