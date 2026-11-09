// M1 verdict engine: Gemini call with structured output, retry with backoff, model fallback.
// Never log the message text or image: suspect messages must not be stored or printed.

import { GoogleGenAI } from "@google/genai";
import { buildSystemInstruction, buildUserPrompt, VERDICT_JSON_SCHEMA } from "./prompt";
import type { ActionType, AnalyzeRequest, RedFlag, RecommendedAction, RiskLevel, ScamType, Verdict } from "./types";
import { extractUrls, looksLikeUrl } from "./urls";

export const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
export const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

const RETRYABLE_STATUS = new Set([429, 500, 503, 504]);
const PRIMARY_ATTEMPTS = 2;
const RETRY_AFTER_SEC = 10;

/** Thrown when Gemini stays overloaded or over quota after retries and fallback. */
export class BusyError extends Error {
  readonly retryAfterSec = RETRY_AFTER_SEC;
  constructor() {
    super("The verdict service is busy.");
    this.name = "BusyError";
  }
}

/**
 * The model answered with valid JSON that is not a verdict (`{}`, `[]`, null, no summary), e.g.
 * a safety-filtered or truncated reply. A SyntaxError so it is retried like malformed JSON.
 */
class MalformedVerdictError extends SyntaxError {
  constructor() {
    super("The model answer is not a usable verdict.");
    this.name = "MalformedVerdictError";
  }
}

/** The one Gemini call we make, injectable for tests. Returns the raw JSON text. */
export type GenerateFn = (args: {
  model: string;
  systemInstruction: string;
  parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[];
}) => Promise<string>;

let client: GoogleGenAI | null = null;

const defaultGenerate: GenerateFn = async ({ model, systemInstruction, parts }) => {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseJsonSchema: VERDICT_JSON_SCHEMA,
    },
  });
  return response.text ?? "";
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: unknown })?.status;
  if (typeof status === "number") return RETRYABLE_STATUS.has(status);
  // Network failures and timeouts have no status: retry those too.
  return true;
}

export async function analyzeWithGemini(
  request: AnalyzeRequest,
  generate: GenerateFn = defaultGenerate,
  backoffMs = 1000,
): Promise<Verdict> {
  const serverUrls = extractUrls(request.text);
  const parts: Parameters<GenerateFn>[0]["parts"] = [];
  if (request.image) parts.push({ inlineData: { mimeType: request.image.mimeType, data: request.image.data } });
  parts.push({ text: buildUserPrompt(request.text, serverUrls) });
  const systemInstruction = buildSystemInstruction(request.locale);

  const attempts = [...Array(PRIMARY_ATTEMPTS).fill(PRIMARY_MODEL), FALLBACK_MODEL] as string[];
  for (let i = 0; i < attempts.length; i++) {
    try {
      const raw = await generate({ model: attempts[i], systemInstruction, parts });
      const parsed: unknown = JSON.parse(raw);
      if (!isUsableVerdict(parsed)) throw new MalformedVerdictError();
      return coerceVerdict(parsed, serverUrls);
    } catch (error) {
      const status = (error as { status?: unknown })?.status;
      console.warn(`[analyze] gemini attempt ${i + 1} (${attempts[i]}) failed:`, status ?? (error as Error)?.name);
      const isLast = i === attempts.length - 1;
      // A malformed answer (SyntaxError) and overload/quota errors are worth another try.
      if (error instanceof SyntaxError || isRetryable(error)) {
        if (!isLast) await sleep(backoffMs * 2 ** i);
        continue;
      }
      // A 400-class error (404 retired model id, 403 permission, bad request) won't change by
      // retrying the same model, but the fallback model may still work: jump straight to it.
      if (isLast) throw error;
      i = attempts.length - 2;
    }
  }
  throw new BusyError();
}

const RISK_LEVELS: readonly RiskLevel[] = ["SAFE", "CAUTION", "DANGER", "CRITICAL"];
const SCAM_TYPES: readonly ScamType[] = [
  "INSTITUTION",
  "FINANCIAL",
  "ACQUAINTANCE",
  "INVESTMENT",
  "ROMANCE",
  "LOAN",
  "OTHER",
];
const ACTION_TYPES: readonly ActionType[] = [
  "DO_NOT_CLICK",
  "CALL_112",
  "CALL_OFFICIAL",
  "ALERT_GUARDIAN",
  "VERIFY_WITH_PERSON",
  "BLOCK_SENDER",
  "NONE",
];

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** A real answer has a known risk level and a one-line summary; anything less is a failed attempt. */
function isUsableVerdict(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  return RISK_LEVELS.includes(o.riskLevel as RiskLevel) && str(o.summary) !== "";
}

/** Turns whatever the model returned into a valid Verdict. Unknown values fall back to safe defaults. */
export function coerceVerdict(raw: unknown, serverUrls: string[]): Verdict {
  const o = (raw ?? {}) as Record<string, unknown>;

  // Unknown risk level → CAUTION ("if unsure, CAUTION").
  const riskLevel = RISK_LEVELS.includes(o.riskLevel as RiskLevel) ? (o.riskLevel as RiskLevel) : "CAUTION";
  const scamType = SCAM_TYPES.includes(o.scamType as ScamType)
    ? (o.scamType as ScamType)
    : riskLevel === "SAFE"
      ? null
      : "OTHER";

  const redFlags: RedFlag[] = arr(o.redFlags)
    .map((f) => {
      const r = (f ?? {}) as Record<string, unknown>;
      return { label: str(r.label), evidence: str(r.evidence), explanation: str(r.explanation) };
    })
    .filter((f) => f.label && f.explanation)
    .slice(0, 4);

  const seen = new Set<ActionType>();
  const recommendedActions: RecommendedAction[] = arr(o.recommendedActions)
    .map((a) => {
      const r = (a ?? {}) as Record<string, unknown>;
      return { type: r.type as ActionType, label: str(r.label) };
    })
    .filter((a) => ACTION_TYPES.includes(a.type) && a.label && !seen.has(a.type) && seen.add(a.type));

  // Server-extracted URLs are facts; the model adds links it read from a screenshot.
  const modelUrls = arr(o.extractedUrls).map(str).filter(looksLikeUrl);
  const extractedUrls = [...new Set([...serverUrls, ...modelUrls])].slice(0, 10);

  return {
    riskLevel,
    scamType,
    summary: str(o.summary),
    redFlags,
    recommendedActions,
    extractedUrls,
  };
}
