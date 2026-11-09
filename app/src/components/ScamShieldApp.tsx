"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { AnalyzeError, AnalyzeRequest, Verdict } from "@/lib/analyze/types";
import { ERROR_COPY, type ClientErrorCode } from "@/lib/copy";
import { UnreadableImageError, screenshotToBase64Jpeg } from "@/lib/image";
import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseProfile,
  saveProfile,
  subscribeProfile,
} from "@/lib/profile";
import Analyzing from "./Analyzing";
import Home from "./Home";
import Onboarding from "./Onboarding";
import VerdictView from "./VerdictView";
import { Screen, buttonStyles } from "./ui";

type Input = Omit<AnalyzeRequest, "locale">;
type View =
  | { name: "home" }
  | { name: "analyzing" }
  | { name: "verdict"; verdict: Verdict }
  | { name: "error"; code: ClientErrorCode; input: Input | null };

// Keeps the analyzing screen readable even when the response is instant.
const MIN_ANALYZING_MS = 1200;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestVerdict(input: Input): Promise<{ verdict: Verdict } | { code: ClientErrorCode }> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, locale: navigator.language || "ko-KR" }),
    });
    if (res.ok) return { verdict: (await res.json()) as Verdict };
    const body = (await res.json().catch(() => null)) as AnalyzeError | null;
    return { code: body?.error.code ?? "INTERNAL" };
  } catch {
    return { code: "NETWORK" };
  }
}

export default function ScamShieldApp() {
  const raw = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getServerProfileSnapshot);
  const profile = useMemo(() => (raw ? parseProfile(raw) : null), [raw]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [view, setViewState] = useState<View>({ name: "home" });

  const setView = (next: View) => {
    setViewState(next);
    window.scrollTo(0, 0);
  };

  const analyze = async (input: Input) => {
    setView({ name: "analyzing" });
    const [result] = await Promise.all([requestVerdict(input), wait(MIN_ANALYZING_MS)]);
    setView("verdict" in result ? { name: "verdict", verdict: result.verdict } : { name: "error", code: result.code, input });
  };

  const analyzeScreenshot = async (file: File) => {
    setView({ name: "analyzing" });
    try {
      const data = await screenshotToBase64Jpeg(file);
      await analyze({ image: { mimeType: "image/jpeg", data } });
    } catch (error) {
      setView({ name: "error", code: error instanceof UnreadableImageError ? "UNREADABLE_IMAGE" : "INTERNAL", input: null });
    }
  };

  if (raw === null) return null; // server render: profile lives on the device only

  if (!profile || editingProfile) {
    return (
      <Onboarding
        initial={profile}
        onCancel={profile ? () => setEditingProfile(false) : undefined}
        onDone={(next) => {
          saveProfile(next);
          setEditingProfile(false);
          setView({ name: "home" });
        }}
      />
    );
  }

  switch (view.name) {
    case "analyzing":
      return <Analyzing />;
    case "verdict":
      return <VerdictView verdict={view.verdict} guardian={profile.guardian} onDone={() => setView({ name: "home" })} />;
    case "error": {
      const copy = ERROR_COPY[view.code];
      const retryInput = copy.retry ? view.input : null;
      return (
        <Screen>
          <div className="flex flex-1 flex-col justify-center" role="alert">
            <h1 className="font-display text-[30px] leading-tight">{copy.title}</h1>
            <p className="mt-3 text-ink-soft">{copy.body}</p>
          </div>
          <div className="flex flex-col gap-2">
            {retryInput && (
              <button type="button" onClick={() => analyze(retryInput)} className={buttonStyles.primary}>
                다시 시도하기
              </button>
            )}
            <button
              type="button"
              onClick={() => setView({ name: "home" })}
              className={retryInput ? buttonStyles.quiet : buttonStyles.primary}
            >
              처음으로 돌아가기
            </button>
          </div>
        </Screen>
      );
    }
    default:
      return <Home onText={(text) => analyze({ text })} onScreenshot={analyzeScreenshot} onEditProfile={() => setEditingProfile(true)} />;
  }
}
