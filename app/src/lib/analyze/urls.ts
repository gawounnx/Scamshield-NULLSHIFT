// URL extraction (SPEC step 1). Pure string parsing: links are never opened or fetched.

// Scheme, www., or a bare domain with a path such as "cj-logistics-kr.top/a8Fk2",
// or a bare domain with a common scam TLD and no path such as "kakao-pay.xyz".
const URL_PATTERN =
  /https?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\/[^\s<>"']*|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:top|xyz|shop|click|link|icu|buzz|cc|me|ly|kr|com|net)\b/gi;

const TRAILING_PUNCTUATION = /[.,!?;:)\]}'"”’。、]+$/;
const MAX_URLS = 10;

export function extractUrls(text: string | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0].replace(TRAILING_PUNCTUATION, "");
    // Skip email addresses ("help@bank.com" would otherwise match "bank.com").
    if (match.index !== undefined && text[match.index - 1] === "@") continue;
    if (url.length > 3) found.add(url);
    if (found.size >= MAX_URLS) break;
  }
  return [...found];
}

// Loose check for URLs the model reports from a screenshot.
export function looksLikeUrl(value: string): boolean {
  return /^(https?:\/\/|www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(value.trim());
}
