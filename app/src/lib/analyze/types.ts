// POST /api/analyze contract. Source of truth: docs/API.md (Verdict also in SPEC.md).

export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

export interface AnalyzeRequest {
  text?: string;
  image?: {
    mimeType: ImageMimeType;
    data: string; // base64 without a "data:" prefix
  };
  locale: string; // BCP 47
}

export type RiskLevel = "SAFE" | "CAUTION" | "DANGER" | "CRITICAL";

export type ScamType =
  | "INSTITUTION"
  | "FINANCIAL"
  | "ACQUAINTANCE"
  | "INVESTMENT"
  | "ROMANCE"
  | "LOAN"
  | "OTHER";

export type ActionType =
  | "DO_NOT_CLICK"
  | "CALL_112"
  | "CALL_OFFICIAL"
  | "ALERT_GUARDIAN"
  | "VERIFY_WITH_PERSON"
  | "BLOCK_SENDER"
  | "NONE";

export interface RedFlag {
  label: string;
  evidence: string;
  explanation: string;
}

export interface RecommendedAction {
  type: ActionType;
  label: string;
}

export interface Verdict {
  riskLevel: RiskLevel;
  scamType: ScamType | null;
  summary: string;
  redFlags: RedFlag[];
  recommendedActions: RecommendedAction[];
  extractedUrls: string[];
}

export type AnalyzeErrorCode = "INVALID_INPUT" | "PAYLOAD_TOO_LARGE" | "BUSY" | "INTERNAL";

export interface AnalyzeError {
  error: {
    code: AnalyzeErrorCode;
    message: string;
    retryAfterSec?: number;
  };
}
