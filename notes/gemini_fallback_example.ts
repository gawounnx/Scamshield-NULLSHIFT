/**
 * Gemini API 호출 헬퍼 (503/429 재시도 및 Flash-Lite 폴백)
 * 
 * HACKATHON_HARNESS.md 지침:
 * "Gemini 503/쿼터 오류: 재시도(지수 백오프) 후 flash-lite로 폴백, 그래도 실패하면 캐시/mock 응답으로 데모 진행"
 * 
 * 의존성:
 * npm install @google/genai
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  mockResponse?: string;
}

/**
 * 지연 함수 (지수 백오프용)
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 503/429 오류 시 재시도 및 경량 모델 폴백을 수행하는 안전한 Gemini 호출 함수
 */
export async function safeGenerateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const { systemInstruction, temperature, mockResponse = 'Mock response: 데모용 백업 데이터입니다.' } = options;

  // 1단계: 기본 모델(Primary) 최대 2회 시도 (지수 백오프)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (error: any) {
      console.warn(`[Gemini Primary] 시도 ${attempt} 실패 (${error?.status || error?.message})`);
      if (attempt < 2) {
        await sleep(1000 * Math.pow(2, attempt - 1)); // 1초 대기 후 재시도
      }
    }
  }

  // 2단계: 경량 모델(Flash-Lite)로 폴백 시도
  console.warn(`[Gemini Fallback] ${FALLBACK_MODEL} 모델로 폴백 시도 중...`);
  try {
    const fallbackResponse = await ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature,
      },
    });

    if (fallbackResponse.text) {
      return fallbackResponse.text;
    }
  } catch (fallbackError: any) {
    console.error(`[Gemini Fallback] 폴백 모델 호출 실패:`, fallbackError?.message);
  }

  // 3단계: 최종 실패 시 Mock 응답 반환 (데모 중단 방지)
  console.warn(`[Gemini Emergency] API 호출 완전 실패. 90초 데모 유지를 위해 Mock 데이터를 반환합니다.`);
  return mockResponse;
}
