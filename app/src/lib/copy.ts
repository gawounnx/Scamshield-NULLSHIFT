import type { AnalyzeErrorCode, RiskLevel, ScamType } from "@/lib/analyze/types";
import type { AgeGroup, Relation } from "@/lib/profile";

// UI words follow GLOSSARY.md.

export const RISK_LABEL: Record<RiskLevel, string> = {
  SAFE: "안전",
  CAUTION: "주의",
  DANGER: "위험",
  CRITICAL: "매우 위험",
};

export const SCAM_TYPE_LABEL: Record<ScamType, string> = {
  INSTITUTION: "기관 사칭",
  FINANCIAL: "금융 사칭",
  ACQUAINTANCE: "지인 사칭",
  INVESTMENT: "투자 사기",
  ROMANCE: "로맨스 스캠",
  LOAN: "대출 사기",
  OTHER: "기타",
};

export const AGE_LABEL: Record<AgeGroup, string> = {
  MINOR: "19세 미만",
  ADULT: "20–59세",
  SENIOR: "60세 이상",
};

export const RELATION_LABEL: Record<Relation, string> = {
  PARENT: "부모",
  CHILD: "자녀",
  OTHER: "기타",
};

export type ClientErrorCode = AnalyzeErrorCode | "NETWORK" | "UNREADABLE_IMAGE";

export const ERROR_COPY: Record<ClientErrorCode, { title: string; body: string; retry: boolean }> = {
  INVALID_INPUT: {
    title: "메시지를 읽지 못했어요",
    body: "메시지를 다시 붙여넣거나 다른 스크린샷을 골라 주세요.",
    retry: false,
  },
  PAYLOAD_TOO_LARGE: {
    title: "메시지가 너무 길어요",
    body: "의심되는 부분만 붙여넣거나, 메시지가 보이게 화면을 잘라서 다시 올려 주세요.",
    retry: false,
  },
  BUSY: {
    title: "지금 판정을 기다리는 사람이 많아요",
    body: "잠시 뒤에 다시 시도해 주세요. 그동안 메시지 속 링크는 누르지 마세요.",
    retry: true,
  },
  INTERNAL: {
    title: "판정을 받지 못했어요",
    body: "잠시 뒤에 다시 시도해 주세요. 그동안 메시지 속 링크는 누르지 마세요.",
    retry: true,
  },
  NETWORK: {
    title: "인터넷에 연결되지 않았어요",
    body: "와이파이나 데이터 연결을 확인한 뒤 다시 시도해 주세요.",
    retry: true,
  },
  UNREADABLE_IMAGE: {
    title: "이 이미지는 열 수 없어요",
    body: "PNG나 JPG 스크린샷을 골라 주세요. 아니면 메시지를 붙여넣어도 돼요.",
    retry: false,
  },
};
