# Inkloom Shield — Working & Broken Features

**Audit date:** 30 October 2026
**Companion files:** `INKLOOM_QA_REPORT.md`, `TEST_CASE_RESULTS.csv`, `evidence/`
**Source changes:** None. Audit-only.

---

## Summary

| Status | Count |
|---|---|
| PASS | 49 |
| PARTIAL | 9 |
| FAIL | 55 |
| NOT IMPLEMENTED | 6 |
| BLOCKED | 2 |
| NOT TESTED | 5 |
| **Total test cases** | **126** |

**Build:** `npm run build` PASS · `tsc --noEmit` PASS · `next lint` FAIL · `npm audit` FAIL (4 high, 1 critical).
**Startup:** `next dev` and `next start` both start successfully.
**Bottom line:** polished demo UI; core audit and publication-gate claims are not reliable.

---

## ✅ Working

### Build, routes and navigation
- [x] Production build compiles all routes (9/9 static pages generated).
- [x] TypeScript passes with no errors.
- [x] `/`, `/workspace`, `/creative-audit`, `/governance` load with HTTP 200.
- [x] Direct URLs and refresh work on all routes.
- [x] Navbar links, logo-to-home, browser back/forward.
- [x] Desktop and tablet layouts render correctly.
- [x] Unknown routes return HTTP 404 (default Next page).
- [x] No console/page errors on the four main routes.

### Audit form and uploads
- [x] Landing form preloads a demo draft, guidelines and specs.
- [x] Blank draft disables Run Audit.
- [x] Run Audit posts to the API and redirects to the workspace.
- [x] Four-step progress overlay displays during the audit.
- [x] TXT and Markdown guideline uploads load text.
- [x] Creative PNG/JPG/GIF/WebP uploads preview correctly.
- [x] Invalid creative type rejected with a clear message.
- [x] Creative over 10 MB rejected with a clear message.
- [x] Missing creative copy blocked with an OCR explanation.
- [x] OCR and visual-AI limitations are clearly disclosed.
- [x] Governance knowledge `.md` upload loads text and saves a record.

### Workspace and remediation
- [x] Tone slider works: Corporate selection sets `strict`, updates preview, persists.
- [x] Apply single fix updates the draft and recalculates.
- [x] Revert restores the original text and reopens the issue.
- [x] Issue filters (All/Factual/Tone/Ambiguity/Resolved) work.
- [x] Citation panel expands and shows a source quote.
- [x] Report and remediation state survive reload in production.
- [x] Markdown export downloads a valid file.
- [x] JSON certificate export downloads valid JSON.
- [x] Governance records and history export download valid JSON.

### Governance
- [x] All five tabs render: Overview, Brand knowledge, Visual & WCAG, Approval workflow, Integrations.
- [x] Add knowledge document.
- [x] Register approved asset.
- [x] WCAG contrast calculator is mathematically correct:
  - `#1A237E` / `#FFFFFF` = 13.24:1
  - `#00C896` / `#1A237E` = 6.12:1
  - `#0F172A` / `#FFFFFF` = 17.85:1
  - `#0D9488` / `#0F172A` = 4.77:1
- [x] Webhook success: local receiver got `POST /hook`, `X-Inkloom-Secret`, and expected event JSON.
- [x] Webhook failure shows a clear CORS/unreachable message.
- [x] Production localStorage persistence survives two reloads.

### API/security basics
- [x] `GET /api/audit` health endpoint.
- [x] Missing/blank/numeric draft returns 400.
- [x] Malformed JSON returns 400 without exposing a stack trace.
- [x] XSS payload is escaped by React and does not execute.
- [x] No hardcoded secrets or `.env` files found.
- [x] No source files modified.

### Responsive
- [x] Landing, creative and governance fit 390px without overflow.
- [x] Tablet layouts (768px) render.
- [x] Desktop layouts (1440px) render.

---

## ⚠️ Partial

- [ ] **Revert** restores text but the score does not return to the original 46% (goes to 69%).
- [ ] **Apply All** resolves 3/3 at 100% but produces a run-on sentence with missing punctuation.
- [ ] **Approval decision log** persists in production but is browser-local, editable, and not tamper-evident.
- [ ] **Basic keyboard navigation** reaches buttons/links, but modal focus escapes and highlights are mouse-only.
- [ ] **Settings save** works, but key handling and connection testing are misleading.
- [ ] **Fake-key audit** returns a deterministic report but with no fallback/error indicator.
- [ ] **Webhook** works from the browser with a shared secret, but is client-side, unsigned, and stored locally.
- [ ] **Governance status** returns `CONDITIONAL_APPROVAL` in some exports but `APPROVED_FOR_PUBLICATION` in others — inconsistent.
- [ ] **Palette/visual review** has UI and sampling, but results are not reliable.

---

## ❌ Broken

### Core audit
- [ ] User-supplied `guidelineText`/`specText` are ignored by the deterministic engine.
- [ ] Trigger words hijack reports:
  - `risk-free` → FinVault report (38%)
  - `smartwatch` → TechCorp report (46%)
  - `aura` → Aura report (32%)
- [ ] Flagged text can be absent from the submitted draft.
- [ ] The original draft is replaced by preset copy.
- [ ] Citations are fabricated (`FinVault_RateSheet.pdf`, `TechCorp_Specs.pdf`, etc.).
- [ ] Compliant copy receives a blanket 94% TONE_MISMATCH.
- [ ] TC-02 misses "guarantees 100% accuracy".
- [ ] TC-03 misses Fortune 500 / since-2018 claims.
- [ ] TC-06 misses 50% off, $24, "today only" and "buy now".
- [ ] TC-07 misses the privacy/data-retention claim.
- [ ] TC-08 misses event date/time.
- [ ] 0/10 supplied text cases pass.
- [ ] 0/6 supplied creatives pass; 4 fail, 1 partial, 1 not implemented.

### Publication gate and certificate
- [ ] Export is allowed at 46% with 3 pending issues.
- [ ] An 87% report with 1 pending **high** issue is labelled `APPROVED_FOR_PUBLICATION`.
- [ ] Editing a 100% report to reintroduce violations leaves it at 100% / Publication Ready.
- [ ] Duplicate phrase fix replaces only the first occurrence but claims full remediation.
- [ ] `cryptographicHash` is `sha256-inkloom-<random>`, not a hash.
- [ ] Markdown export says "Verified & Remediated" while issues are pending.

### Error handling
- [ ] HTTP 500 or network abort silently loads the TechCorp demo report.
- [ ] The user's draft is discarded on failure; no error/retry.
- [ ] Invalid Gemini key returns 200 and the UI says "Connected to Gemini API successfully."

### Persistence and governance
- [ ] `next dev`: added knowledge documents/approvals disappear after reload (reproduced twice).
- [ ] "Edit in form" creates a duplicate Version 1 instead of updating.
- [ ] Knowledge/asset/approval deletes happen immediately with no confirmation.
- [ ] Approving an 82% item forces 100%; rejecting leaves it at 100%.
- [ ] "Submit to Brand Lead" shows "Submitted!" but writes nothing.
- [ ] Palette sampler passes the pink off-brand creative because white/gray is registered.
- [ ] Off-brand color is never checked in creative audit.
- [ ] Governance data is local-only; no cross-device/shared review.

### API/security
- [ ] API is unauthenticated.
- [ ] No rate limiting (10 concurrent → 10×200 in 8 ms).
- [ ] No request/response size limit (100k words → 5.9 MB response).
- [ ] No CSP, nosniff, frame protection, Referrer-Policy, HSTS or Permissions-Policy.
- [ ] `X-Powered-By: Next.js` exposed.
- [ ] API key stored plaintext in localStorage and re-shown after reload.
- [ ] API key posted to `/api/audit` despite "never sent to external servers".
- [ ] 5 dependency vulnerabilities (4 high, 1 critical); production tree has 2.

### Mobile
- [ ] Nav links hidden below 768px; no hamburger/menu.
- [ ] Creative Audit and Governance unreachable from mobile UI.
- [ ] Workspace overflows 461px in a 390px viewport.

### Accessibility
- [ ] 68 axe color-contrast violations across four routes.
- [ ] Inputs/textareas lack programmatic labels.
- [ ] Modals have no `role="dialog"` or `aria-modal`.
- [ ] No focus trap; Escape does not close.
- [ ] Icon-only close buttons have no accessible name.
- [ ] Violation `<mark>` highlights are not keyboard focusable.
- [ ] No skip link.
- [ ] Workspace has no `<main>` landmark.

### Build/quality
- [ ] `npm run lint` fails (1 error, 2 warnings).
- [ ] Build skips linting (`ignoreDuringBuilds: true`).
- [ ] No automated tests.
- [ ] PDF upload reads raw `%PDF` bytes into the guideline field.

---

## 🚫 Not implemented

- Automatic OCR / text extraction from creative images.
- Computer vision for logo, layout or color verification.
- Shared/multi-user governance backend.
- Real cryptographic signing/hashing of certificates.
- Automated test suite in the repository.
- Branded 404 page (functional default 404 exists).

---

## 🔒 Blocked / not tested

| Item | Reason |
|---|---|
| Live Gemini audit | No valid API key/env file |
| Live Anthropic audit | No valid API key/env file |
| Prompt-injection resistance | Live model unavailable |
| Firefox/Safari/WebKit | Chromium-only audit |
| Real screen reader (NVDA/VoiceOver) | Not available |
| Lighthouse/Core Web Vitals | Not run |
| 200% zoom/reflow | Not run |
| External production webhook/CORS | Local synthetic receiver only |
| Penetration/load test | Out of scope |

---

## Top 10 fixes (recommended order)

1. **Remove preset hijack (P0-01).** Make the engine read the submitted draft, guidelines and specs. Presets only behind an explicit demo action; never replace user text or fabricate citations.
2. **Enforce one real publication gate (P0-02).** Recompute on every edit; block export/certificates for unresolved high/critical issues or scores below threshold; derive status from issues server-side.
3. **Remove fake certificate claims (P0-03).** Delete `cryptographicHash`/`sha256-` unless a real digest is computed; stop saying "Verified & Remediated" with pending issues.
4. **Fail loudly (P1-01, P1-05).** Never substitute a demo report on API/network/provider failure. Show an error, preserve the draft, offer retry. Make Test Connection validate the provider rather than reporting fallback as success.
5. **Fix key handling (P1-05).** Keep secrets server-side; if BYOK is required, use memory-only storage and state that the key is sent to the provider.
6. **Harden the API (P1-06, P1-07).** Add auth, per-tenant rate limits, body/output caps, timeouts, and baseline security headers.
7. **Fix remediation integrity (P1-02, P1-03, P2-05).** Re-audit edits, replace all occurrences, and unify scoring (no hardcoded 46% baseline).
8. **Fix mobile navigation and overflow (P1-08, P2-08).** Add a labelled hamburger menu; add `min-w-0`/wrapping to the workspace toolbar.
9. **Fix accessibility blockers (P1-10).** Contrast tokens, labels, dialog semantics/focus trap/Escape, keyboard-operable highlights, skip link, `<main>`.
10. **Fix governance trust (P1-04, P1-09, P2-03, P2-09).** Stop forcing 100% on approval; fix dev persistence; add versioned edits and delete confirmations; plan a real backend if this is more than a demo.

**Next:** PDF handling (P1-11), evidence-based tone checks (P1-12), visual/palette review (P2-01/02), remove fake RFC submit (P2-04), lint/tests/dependency upgrade (P2-06/07), then P3 polish.

---

## Release recommendation

**Do not ship as a governance or compliance product in its current state.** It is suitable as a UI prototype/demo only if every audit result is clearly labelled synthetic and the export/certificate paths are disabled. The fastest path to a credible demo is to remove fake-success behaviour and show honest "analysis unavailable" states rather than preset reports.
