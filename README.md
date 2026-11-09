# ScamShield

**Snap a suspicious message, and ScamShield tells you if it's a scam, why, and what to do — then helps you alert someone you trust.**

- Live app: https://scamshield-nullshift.vercel.app (open it on your phone)
- Demo video (90s): _TBD_
- Built in 5 hours at c0mpiled-17 Seoul for YC RFS **"AI-Powered Consumer Products for a Billion People"**

## The problem

Scam messages arrive through SMS, KakaoTalk, email, and DMs, and many have no link at all ("Mom, my phone broke, send me your card photo"). People have to decide on the spot, alone.

- 57% of adults worldwide faced a scam in the past 12 months, and 23% lost money. 93% try to check whether a message is real, but mostly with weak methods like spotting typos. ([GASA × Feedzai, Global State of Scams 2025](https://www.gasa.org/post/global-scams-on-the-rise-over-half-of-adults-worldwide-report-scam-encounters))
- Existing checkers in Korea only accept copy-pasteable text with a link, and answer with a 3-level label and no explanation.
- Older adults and minors are hit hardest, and often have nobody next to them to ask.

## What ScamShield does

1. **Any message, any format.** Upload a screenshot or paste text. Works for messages without links (family impersonation, fake prosecutors).
2. **A verdict you can understand.** A risk stamp (Safe / Caution / Danger / Critical), the scam type, a one-line summary, and red flags that quote the exact words from the message.
3. **What to do next.** Action buttons such as "Don't tap the link", "Call the person on their old number", and a one-tap **112** (police) call for critical scams.
4. **Any language.** A Vietnamese or English scam text is explained in the language of your phone.
5. **Alert someone you trust.** For Danger and above, one tap opens your phone's share sheet (KakaoTalk, SMS) with a summary for your guardian. The original message is left out by default.

### Clear boundaries

- Never opens links in the message. Links are only parsed as text.
- Never sends anything until you tap.
- Never stores the original message or image. Guardian info stays on your phone only.

## Try it

Open the live app, pick your age group, optionally add a guardian, then tap one of the sample messages:
parcel smishing → **Critical**, "my phone broke" family impersonation → **Danger**, English account-lock text → **Danger+** explained in your language, normal delivery notice → **Safe**.

## How it works

```
Phone (Next.js, mobile web)
  └─ POST /api/analyze  { text?, image?, locale }
       1. Extract URLs (string parsing only, never fetched)
       2. Gemini Flash-Lite with structured JSON output → Verdict
          retry with backoff on 429/503, then a fallback model
       3. Server-enforced rules: Danger+ → "alert guardian",
          Critical → "call 112", Safe → no scam type, no "open link" actions
```

- **Stack:** Next.js (App Router) + Tailwind, deployed on Vercel, Google Gemini API.
- **API contract:** [docs/API.md](docs/API.md) · **Spec:** [SPEC.md](SPEC.md) · **Glossary:** [GLOSSARY.md](GLOSSARY.md)
- If Gemini is overloaded, the demo samples still answer from cached verdicts so the demo never breaks.

## Run locally

```bash
cd app
npm install
echo "GEMINI_API_KEY=your_key" > .env.local   # optional: without a key the API returns mock verdicts
npm run dev                                    # http://localhost:3000
npm test                                       # unit + API tests (Gemini is faked)
npm run build && python3 ../.claude/skills/webapp-testing/scripts/with_server.py --server "ANALYZE_ALLOW_MOCK=1 npx next start -p 3100" --port 3100 -- python3 ../tests/e2e/demo_flow.py http://localhost:3100   # e2e demo flow (#6); needs: pip install playwright && playwright install chromium
```

## Business model

Free for individuals so it can reach a billion people. Revenue from a **family plan** (guardians for parents and kids) and a **B2B2C verdict API** for banks, card companies, and telecom carriers.

## Future work

- Let users choose to include the original message in the guardian alert
- URL reputation checks (look-alike domains, suspicious TLDs, Google Safe Browsing)
- Full UI translation beyond Korean, a "pause and confirm" screen for users without a guardian
- Anonymous verdict statistics (no original text) to track new scam patterns

## How we built it

Two people, two AI coding agents (Claude Code for building, Codex for testing and fixes), in 5 hours.
Skills used: `grilling`, `domain-modeling` (spec), `to-tickets` ([issues #1–#8](https://github.com/gawounnx/Scamshield-NULLSHIFT/issues)), `implement`, `frontend-design`, `code-review`, `webapp-testing`, and GStack (`/gstack-careful`, `/gstack-freeze`, `/gstack-canary`) where our base skills had gaps. See [HACKATHON_HARNESS.md](HACKATHON_HARNESS.md).

## Team NULLSHIFT

- **Gawon Cha** — frontend, guardian alert, deployment, demo
- **Yongmin Ko** — backend/AI, Gemini verdict engine
