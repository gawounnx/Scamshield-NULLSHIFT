import type { ReactNode } from "react";
import type { RiskLevel } from "@/lib/analyze/types";
import { RISK_LABEL } from "@/lib/copy";

export const RISK_TEXT: Record<RiskLevel, string> = {
  SAFE: "text-safe",
  CAUTION: "text-caution",
  DANGER: "text-danger",
  CRITICAL: "text-critical",
};

const base =
  "inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[19px] font-bold transition-[transform,background-color] active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";

export const buttonStyles = {
  base,
  primary: `${base} bg-ink text-white`,
  secondary: `${base} border-2 border-ink bg-surface text-ink`,
  quiet: `${base} min-h-12 text-ink-soft underline underline-offset-4 font-medium`,
};

export function Screen({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-10 pt-6">{children}</main>;
}

/** The verdict seal. `level` null draws an empty, waiting seal. */
export function Seal({ level, size = 156 }: { level: RiskLevel | null; size?: number }) {
  const words = level ? RISK_LABEL[level].split(" ") : [];
  const fontSize = words.length > 1 ? size * 0.26 : size * 0.38;
  return (
    <div
      className={`${level ? `seal ${RISK_TEXT[level]}` : "seal-wait text-ink-soft"} shrink-0 rounded-[24%] border-[5px] border-current p-[5px]`}
      style={{ width: size, height: size, transform: "rotate(-6deg)" }}
      role={level ? "img" : undefined}
      aria-label={level ? `위험 등급: ${RISK_LABEL[level]}` : undefined}
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center rounded-[20%] border-2 border-current font-display leading-[1.05]"
        style={{ fontSize }}
        aria-hidden
      >
        {words.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
    </div>
  );
}

export function Icon({ name, className = "size-6" }: { name: "camera" | "phone" | "share" | "check" | "back"; className?: string }) {
  const paths: Record<typeof name, ReactNode> = {
    camera: (
      <>
        <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.6-2.2h5.8L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
        <circle cx="12" cy="12.8" r="3.4" />
      </>
    ),
    phone: (
      <path d="M6.6 3.8 9 3.5l1.6 4-2 1.3a10.5 10.5 0 0 0 6.6 6.6l1.3-2 4 1.6-.3 2.4a2 2 0 0 1-2 1.7C10.3 19.1 4.9 13.7 4.9 5.8a2 2 0 0 1 1.7-2Z" />
    ),
    share: (
      <>
        <path d="M12 15V4m0 0L8 8m4-4 4 4" />
        <path d="M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12" />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    back: <path d="M15 5 8 12l7 7" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}
