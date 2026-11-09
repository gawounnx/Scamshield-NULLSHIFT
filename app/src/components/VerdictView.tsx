"use client";

import { useState } from "react";
import type { RecommendedAction, Verdict } from "@/lib/analyze/types";
import { RISK_LABEL, SCAM_TYPE_LABEL } from "@/lib/copy";
import type { Guardian } from "@/lib/profile";
import { Icon, RISK_TEXT, Screen, Seal, buttonStyles } from "./ui";

interface Props {
  verdict: Verdict;
  guardian: Guardian | null;
  onDone: () => void;
}

// Guardian alert without the original message (SPEC.md M2). Opens a share sheet; never sends by itself.
async function alertGuardian(verdict: Verdict, guardian: Guardian): Promise<string | null> {
  const type = verdict.scamType ? ` (${SCAM_TYPE_LABEL[verdict.scamType]})` : "";
  const text = `ScamShield 판정: ${RISK_LABEL[verdict.riskLevel]}${type}\n${verdict.summary}\n\n이 메시지를 받았어요. 전화로 한번 확인해 주세요.`;

  if (navigator.share) {
    try {
      await navigator.share({ text });
      return null;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return null;
    }
  }
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    window.location.href = `sms:${guardian.phone}?body=${encodeURIComponent(text)}`;
    return null;
  }
  try {
    await navigator.clipboard.writeText(text);
    return "알림 내용을 복사했어요. 보호자에게 붙여넣어 보내 주세요.";
  } catch {
    return "이 브라우저에서는 보낼 수 없어요. 휴대폰에서 다시 열어 주세요.";
  }
}

export default function VerdictView({ verdict, guardian, onDone }: Props) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const critical = verdict.riskLevel === "CRITICAL";
  const tint = RISK_TEXT[verdict.riskLevel];
  const showGuardianAlert = verdict.recommendedActions.some((a) => a.type === "ALERT_GUARDIAN");

  const toggle = (index: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const renderAction = (action: RecommendedAction, index: number) => {
    if (action.type === "CALL_112") {
      if (critical) return null; // already shown as the main button
      return (
        <a href="tel:112" className={buttonStyles.secondary}>
          <Icon name="phone" />
          {action.label}
        </a>
      );
    }
    if (action.type === "ALERT_GUARDIAN") return null; // shown near the top, under the 112 button
    if (action.type === "NONE") return <p className="py-2 font-medium">{action.label}</p>;
    const checked = done.has(index);
    return (
      <button
        type="button"
        onClick={() => toggle(index)}
        aria-pressed={checked}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 text-left font-bold"
      >
        <span className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${checked ? "border-ink bg-ink text-white" : "border-line text-transparent"}`}>
          <Icon name="check" className="size-4" />
        </span>
        <span className={checked ? "text-ink-soft line-through" : ""}>{action.label}</span>
      </button>
    );
  };

  return (
    <Screen>
      <button type="button" onClick={onDone} className="-ml-2 grid size-11 place-items-center self-start rounded-full" aria-label="처음으로">
        <Icon name="back" />
      </button>

      <div className="mt-4 flex items-center gap-6">
        <Seal level={verdict.riskLevel} />
        <div>
          <p className="text-base text-ink-soft">사기 유형</p>
          <p className={`text-[22px] font-bold ${tint}`}>
            {verdict.scamType ? SCAM_TYPE_LABEL[verdict.scamType] : "해당 없음"}
          </p>
        </div>
      </div>

      <h1 className="mt-8 text-[26px] font-bold leading-snug">{verdict.summary}</h1>

      {critical && (
        <a href="tel:112" className={`${buttonStyles.base} mt-6 min-h-16 bg-critical text-[21px] text-white`}>
          <Icon name="phone" className="size-7" />
          112에 전화하기
        </a>
      )}
      {critical && <p className="mt-2 text-base text-ink-soft">신고와 지급정지를 한 번에 요청할 수 있어요.</p>}

      {/* Demo scenario 3: the guardian alert sits right under 112 (or the summary), not at the end of the list. */}
      {showGuardianAlert && guardian && (
        <>
          <button
            type="button"
            className={`${critical ? buttonStyles.secondary : buttonStyles.primary} mt-4`}
            onClick={async () => setNotice(await alertGuardian(verdict, guardian))}
          >
            <Icon name="share" />
            {guardian.name}에게 알리기
          </button>
          {notice && (
            <p className="mt-2 text-base font-medium" role="status">
              {notice}
            </p>
          )}
        </>
      )}

      {verdict.redFlags.length > 0 && (
        <section className="mt-10" aria-labelledby="red-flags">
          <h2 id="red-flags" className="font-display text-[24px]">
            의심 신호 {verdict.redFlags.length}개
          </h2>
          <ul className="mt-4 flex flex-col gap-7">
            {verdict.redFlags.map((flag) => (
              <li key={flag.label + flag.evidence}>
                <p className={`font-bold ${tint}`}>{flag.label}</p>
                <blockquote className="mt-2 mr-8 rounded-[20px] rounded-tl-md bg-bubble px-4 py-3 text-[17px] leading-relaxed">
                  {flag.evidence}
                </blockquote>
                <p className="mt-2 text-ink-soft">{flag.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10" aria-labelledby="actions">
        <h2 id="actions" className="font-display text-[24px]">
          권장 행동
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {verdict.recommendedActions.map((action, index) => {
            const node = renderAction(action, index);
            return node && <li key={action.type + index}>{node}</li>;
          })}
        </ul>
      </section>

      <button type="button" onClick={onDone} className={`${buttonStyles.secondary} mt-12`}>
        다른 메시지 확인하기
      </button>
    </Screen>
  );
}
