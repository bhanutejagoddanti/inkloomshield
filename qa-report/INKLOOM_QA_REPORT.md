# Inkloom Shield — Full QA / Functional / Security Audit

**Project:** `inkloomshield-main` (Next.js 14.2.35)
**Audit date:** 30 October 2026
**Prepared by:** OpenCode QA agent
**Source policy:** Audit-only. No application source file was modified. Only `qa-report/` was added.

---

## 1. Executive summary

**Verdict: NOT PRODUCTION-READY.**

The application builds and starts cleanly, looks polished on desktop, and most UI interactions work. However, the product's core claim — auditing a user's draft against the user's guidelines and specifications — is not implemented by the deterministic engine. It routes drafts containing trigger words to hardcoded demo reports, replaces the draft with unrelated preset text, and fabricates citations. This alone invalidates the primary workflow and every governance decision built on top of it.

Compounding this, the publication gate does not gate: content can be exported at 46%, an unresolved high-severity issue at 87% is labelled `APPROVED_FOR_PUBLICATION`, and editing a remediated draft does not trigger re-analysis. The exported "cryptographicHash" is a random string, not a hash.

| Metric | Result |
|---|---|
| Test cases executed / recorded | **126** |
| PASS | **49** |
| PARTIAL | **9** |
| FAIL | **55** |
| NOT IMPLEMENTED | **6** |
| BLOCKED | **2** |
| NOT TESTED | **5** |
| Production build | **PASS** |
| Type check | **PASS** |
| Lint | **FAIL** (1 error, 2 warnings) |
| `npm audit` | **FAIL** (5 vulnerabilities: 4 high, 1 critical) |
| Supplied text pack (10 cases) | **0 PASS, 2 PARTIAL, 7 FAIL, 1 NOT IMPLEMENTED** |
| Supplied creatives (6 images) | **0 PASS, 1 PARTIAL, 4 FAIL, 1 NOT IMPLEMENTED** |
| Accessibility (axe, 4 routes) | **FAIL** — 68 contrast violations total |

### Top five findings

1. **P0-01** — The deterministic audit ignores supplied guidelines/specs and substitutes hardcoded FinVault/TechCorp/Aura reports for keyword-matched drafts.
2. **P0-02** — No effective publication gate: export at 46%, `APPROVED_FOR_PUBLICATION` at 87% with a pending high issue, and 100% after reintroducing violations.
3. **P0-03** — Export certificates use a fake `sha256-inkloom-<random>` hash and claim "Verified & Remediated" while issues remain.
4. **P1-01/P1-05** — API/network failure silently loads a demo report instead of an error, and an invalid API key is reported as "Connected to Gemini API successfully."
5. **P1-05/P1-06/P1-07** — API keys are stored in plaintext localStorage and posted to the server despite "never sent"; the API has no auth, rate limit, size limit, or security headers.

---

## 2. Environment and setup

| Item | Value |
|---|---|
| OS | macOS (darwin) |
| Node.js | v26.4.0 |
| npm | 11.16.0 |
| Next.js | 14.2.35 |
| React | 18 |
| Browser automation | Playwright 1.64.1 (installed in temp dir, not added to project) |
| Browser engine | Chromium 143 (desktop 1440×900, tablet 768×1024, mobile 390×844) |
| Dev server | `next dev` on port 3001 — started successfully |
| Production server | `next build` then `next start` on port 3100 — started successfully |
| Webhook receiver | Local synthetic receiver on `127.0.0.1:4599` |
| Test pack | `inkloom-shield-test-pack/` (10 text cases, 6 creative images, brand references) |

The pre-existing service on port 3000 was left untouched. QA-started servers and the local receiver were stopped after evidence capture.

**Build output:** compiled successfully, 9/9 static pages, routes `/`, `/workspace`, `/creative-audit`, `/governance`, `/api/audit`, `/_not-found`. First-load JS 111–146 kB (shared 87.3 kB).

---

## 3. Scope and method

### In scope
- All four application routes plus `/api/audit` and unknown-route handling.
- Navigation, forms, uploads, validation, dialogs, filters, remediation, exports, localStorage, webhooks, responsive layouts.
- All 10 supplied text audit cases through both API and UI.
- All 6 supplied creative images with manually transcribed on-image copy (OCR is not implemented).
- Deterministic audit engine, provider fallback paths, error states.
- Security basics: headers, XSS, auth/rate/size, secret scan, API-key handling, dependency audit.
- Accessibility: axe-core WCAG 2 A/AA, labels, modal semantics, keyboard access.

### Out of scope / constraints
- No valid Gemini or Anthropic key was available; live model quality is **BLOCKED**.
- No external/production webhook or real customer data was used. The receiver was local and synthetic.
- No OCR or computer-vision engine exists; creative results are copy-only.
- No source changes, dependency upgrades, or `npm audit fix` were performed.
- Cross-browser, screen-reader, load, penetration, and Lighthouse testing were not available (see limitations).

### Status vocabulary
| Status | Meaning |
|---|---|
| PASS | Behaves as expected |
| PARTIAL | Some expected behaviour works; material gaps remain |
| FAIL | Does not meet the expected result |
| NOT IMPLEMENTED | Feature/control does not exist |
| BLOCKED | Could not be executed because a required dependency/credential was unavailable |
| NOT TESTED | Not exercised in this audit; reason recorded |

### Severity
- **Critical** — invalidates the core product claim or permits publication of known-bad content.
- **High** — major functional/security/accessibility failure with realistic user impact.
- **Medium** — degraded behaviour, usability or defense-in-depth gap.
- **Low / Info** — cosmetic, informational, or documented limitation.

---

## 4. Build, lint, type-check and dependencies

| Check | Command | Result | Detail |
|---|---|---|---|
| Production build | `npm run build` | **PASS** | Exit 0; compiled successfully; 9/9 static pages |
| TypeScript | `npx tsc --noEmit` | **PASS** | Exit 0; no diagnostics |
| ESLint | `npm run lint` | **FAIL** | 1 error, 2 warnings |
| Lint in build | `next.config.mjs` | **FAIL** | `eslint.ignoreDuringBuilds: true`; build says "Skipping linting" |
| Tests | repository scan | **NOT IMPLEMENTED** | No test runner, script or specs |

### Lint failure
```
src/app/creative-audit/page.tsx
  74:186  Error: `'` can be escaped with `&apos;` ... react/no-unescaped-entities
  59:498  Warning: Using <img> ... @next/next/no-img-element
src/app/governance/page.tsx
  253:102 Warning: Using <img> ... @next/next/no-img-element
```

### Dependency vulnerabilities
`npm audit` reports **5 vulnerabilities (4 high, 1 critical)**:

| Package | Severity | Scope | Advisory / note |
|---|---|---|---|
| `next` | Critical | Production | Self-hosted DoS via Image Optimizer `remotePatterns`; fix is Next **16.4.3** (semver-major) |
| `postcss` | High | Production (transitive) | XSS via unescaped `</style>` in stringify output |
| `glob` | High | Dev (transitive) | CLI command injection via `-c/--cmd` |
| `eslint-config-next` | High | Dev | Fix requires major upgrade |
| `@next/eslint-plugin-next` | High | Dev (transitive) | Fix requires major upgrade |

`npm audit --omit=dev` still reports **2 vulnerabilities (1 critical, 1 high)**. No forced or breaking upgrade was applied.

---

## 5. Routes and navigation

| Route | Status | Result |
|---|---|---|
| `/` | PASS | HTTP 200, hero + audit form, no console errors |
| `/workspace` | PASS | HTTP 200, report renders, no console errors |
| `/creative-audit` | PASS | HTTP 200, upload form, no console errors |
| `/governance` | PASS | HTTP 200, all tabs, no console errors |
| `/does-not-exist` | PASS | HTTP 404 with Next default page (unbranded) |

### Working
- All primary nav links, logo-to-home, browser back/forward, direct refresh and direct route access.
- Desktop (1440px) and tablet (768px) layouts render without overflow.
- No unexpected console or page errors on the four main routes.

### Broken / degraded
- **Mobile navigation is unusable (NAV-10).** Below 768px the nav container is `display:none`; every link measures 0×0; there is no hamburger/menu button on any route. After leaving the landing page, mobile users cannot reach Creative Audit or Governance from the UI. Direct URLs still work.
- **Workspace overflows horizontally at 390px (NAV-11).** `scrollWidth` is 461 vs `clientWidth` 390. The toolbar `h1` (`max-w-xs`) and non-`min-w-0` flex row cause 71px of overflow. The other three routes are 390/390.
- Unknown routes use the default Next 404, with no branding or way back (P3-01).

---

## 6. Supplied test pack results

All 10 cases were run through `POST /api/audit` and through the landing-page UI. Scores and findings matched between API and UI.

| ID | Case | Expected | Actual | Status |
|---|---|---|---|---|
| TC-01 | Valid and compliant | Pass / low risk | 94%, generic TONE_MISMATCH on the entire valid copy | **FAIL** |
| TC-02 | Unsupported accuracy guarantee | Flag 100% accuracy + replacement of reviewers | 94%, generic tone flag only; "guarantees 100% accuracy" missed | **FAIL** |
| TC-03 | Unsupported customer/history claims | Flag Fortune 500 / since 2018 | 94%, generic tone flag only; neither claim flagged | **FAIL** |
| TC-04 | Unsupported competitor superlative | Flag absolute comparison + promise | 87%, flags only "always"; "better than all competitors"/"best results" missed | **PARTIAL** |
| TC-05 | Tone mismatch | Flag slang-heavy exaggerated tone | 94%, generic whole-sentence tone flag; no specific explanation | **PARTIAL** |
| TC-06 | Unapproved discount | Request offer brief; flag price/discount | 87%, flags only "Guaranteed"; 50%, "today only", $24 missed | **FAIL** |
| TC-07 | Privacy concern | Flag broad data disclaimer | 94%, generic tone flag only | **FAIL** |
| TC-08 | Event details | Validate date/time against brief | 94%, generic tone flag only; date/time missed | **FAIL** |
| TC-09 | Safe capability description | Likely acceptable | 94% false-positive TONE_MISMATCH on safe copy | **FAIL** |
| TC-10 | Color mismatch visual | Compare pink creative with navy/teal | No visual/color analysis; copy-only 94% tone flag | **NOT IMPLEMENTED** |

**Pack result:** 0 PASS, 2 PARTIAL, 7 FAIL, 1 NOT IMPLEMENTED.

### Root cause
`runDeterministicAudit` does not analyse the supplied `guidelineText` or `specText`. It scans for trigger terms and returns preset reports:
- `risk-free` → **FinVault Q4 Wealth Campaign** (38%), flagged text absent from the draft.
- `smartwatch` → **TechCorp SmartWatch Launch** (46%), full preset draft substituted.
- `aura` → **Aura Health Mobile Wellness** (32%), three unrelated high-severity findings.
- Otherwise → a 94% generic report with a TONE_MISMATCH covering the whole draft.

Custom guideline test: draft `We guarantee 100% accuracy.` with guideline `Never use the word banana.` and spec `The sky is green.` returned a generic 94% tone flag; the guideline text never appeared in the report. The engine does not use the supplied documents.

Example (SEC-04):
```
Draft:    "Smartwatch battery life is good."
Result:   "TechCorp SmartWatch Launch Announcement Draft", 46%
Flagged:  "lasts a full 48 hours on a single charge"  → not present in draft
           "is super cheap at just $149!"              → not present in draft
           "You can even wear it while diving..."       → not present in draft
```

---

## 7. Creative audit results

Six supplied images were uploaded and their on-image copy manually entered. All uploads previewed correctly; the app clearly discloses that OCR and computer vision are not implemented.

| Image | Copy tested | Score | Result | Status |
|---|---|---|---|---|
| 01 valid campaign post | Smarter Content for a Safer Brand… | 94% | False-positive TONE_MISMATCH on valid headline | **FAIL** |
| 02 promotional offer | 50% DISCOUNT, $49 → $24 | 94% | Only tone mismatch; discount/price missed | **FAIL** |
| 03 webinar poster | March 15, 2025, 11:00 AM IST | 94% | Only tone mismatch; event details missed | **FAIL** |
| 04 social post | Create. Review. Publish… | 94% | False-positive tone flag and broken highlight fragment "Create" | **FAIL** |
| 05 misleading ad | World's #1, Guaranteed 100% accuracy | 87% | Only "Guaranteed" flagged; #1 and 100% missed | **PARTIAL** |
| 06 off-brand color | Beautiful Brand Stories… | 94% | No color check; pink palette never considered | **NOT IMPLEMENTED** |

**Creative result:** 0 PASS, 1 PARTIAL, 4 FAIL, 1 NOT IMPLEMENTED.

### Positive
- PNG, JPG, GIF and generated WebP all accepted; WebP preview works.
- Invalid type rejected with a clear message.
- 11.5 MB file rejected with "Image must be 10 MB or smaller."
- Empty copy blocked with an OCR explanation.
- No OCR / visual AI claim is made; the limitation is disclosed twice.

### Negative
- The same generic 94% tone report is produced for five of six creatives, regardless of content.
- The only image with meaningful detection (05) catches one of three claims.
- The off-brand pink creative receives no color-drift signal.
- Scores and citations are not tied to the uploaded image or its copy in any meaningful way.

---

## 8. Workspace and remediation

| Feature | Result | Status |
|---|---|---|
| Tone slider | Corporate selection persists, preview changes to Corporate | **PASS** |
| Apply single fix | Draft updates, issue resolved, score recalculated | **PASS** |
| Revert | Text reverts, issue pending; score does not return to 46 (goes to 69) | **PARTIAL** |
| Apply All | 3/3 resolved at 100, but output is a run-on sentence | **PARTIAL** |
| Filters | All/Factual/Tone/Ambiguity/Resolved filter correctly | **PASS** |
| Citation expand | Source quote panel works | **PASS** |
| Report persistence | Survives reload in production build | **PASS** |
| Edit after remediation | No re-audit; score stays 100/Publication Ready | **FAIL** |
| Duplicate phrase fix | Replaces first occurrence only; still says Fully remediated 100% | **FAIL** |
| Demo score consistency | 46 → 81 after one fix → 69 after revert with same 3 pending issues | **FAIL** |

### Detail
**Tone slider retest (WS-01):** the earlier ambiguous result was a bad selector. A scoped retest selected Corporate in the first issue card and produced `selectedTone: "strict"`, `"Corporate rewrite preview"`, and persisted state. **PASS**.

**Apply All output (WS-04):**
> "The new TechCorp SmartWatch provides up to 24 hours of reliable all-day battery life on a single charge and offers compelling premium value starting at $199 features IP67 water and splash resistance built for your active everyday lifestyle"

Missing periods/conjunctions; 100% and "Publication Ready" despite the broken draft.

**Duplicate phrase (WS-08):**
- Before: `Our app is super cheap. Our app is super cheap.`
- After fix: `Our app is compelling value. Our app is super cheap.`
- UI: 100%, "Fully remediated", "All compliance gates passed."

**Edit after remediation (WS-07):** after Apply All (100%), adding `Inkloom guarantees 100% accuracy and is safe for deep ocean scuba diving.` in Edit mode leaves the score at 100 and Export enabled. The draft textarea updates local report state directly (`updateReportState`) without re-running the audit.

**Demo scores (WS-09):** the 46% initial value is hardcoded in the preset. Any state change recalculates from issue severities: the same 3 pending issues yield 69%; after fixing one they yield 81%.

---

## 9. Export and publication gate

| Test | Actual | Status |
|---|---|---|
| Markdown export | 489-byte `.md` downloads with draft + score header | **PASS** |
| JSON certificate export | Valid JSON downloads with report/issues | **PASS** |
| Export at 46% with 3 pending issues | Modal opens; both downloads offered; no warning/block | **FAIL** |
| Export with unresolved high issue at 87% | `governanceStatus: "APPROVED_FOR_PUBLICATION"` | **FAIL** |
| Certificate hash | `sha256-inkloom-3lkg47qlaq` / `sha256-inkloom-x8i4eqeaoo` — not a SHA-256 | **FAIL** |
| Certificate wording | `.md` says "Verified & Remediated" while 3 issues pending | **FAIL** |
| Governance records/history export | Valid JSON downloads (3,798 bytes records) | **PASS** |

### Critical exported evidence
```json
{
  "currentScore": 87,
  "governanceStatus": "APPROVED_FOR_PUBLICATION",
  "pendingIssues": 1,
  "pendingSeverity": "high",
  "cryptographicHash": "sha256-inkloom-3lkg47qlaq"
}
```
The hash is a random 10-character suffix, not 64 hex characters. There is no signature, canonical payload, timestamp authority, or server-side generation.

**Export gate conclusion:** the gate is cosmetic. No score threshold, unresolved-issue check, identity check, or server-side validation prevents export. The modal presents a certificate regardless of state.

---

## 10. Governance hub

| Area | Result | Status |
|---|---|---|
| Five tabs | Overview, Knowledge, Visual & WCAG, Approvals, Integrations render | **PASS** |
| Add knowledge document | Record added and listed | **PASS** |
| Load .md knowledge file | 1,840 chars loaded; save creates record | **PASS** |
| Delete knowledge | Immediate; no confirmation | **FAIL** |
| Edit in form | Copies to create form; saving creates duplicate Version 1 | **FAIL** |
| Register asset | Asset count 2 → 3, visible | **PASS** |
| Delete asset | Immediate; no confirmation | **FAIL** |
| Palette sampling | Both navy and pink creatives "near a registered brand color" | **FAIL** |
| WCAG contrast checker | Ratios 13.24, 6.12, 17.85, 4.77 all correct | **PASS** |
| Approve item | 82% → 100% unconditionally | **FAIL** |
| Reject item | Stays 100%; history records "Rejected 100%" | **FAIL** |
| Delete approval | Immediate; no confirmation | **FAIL** |
| Decision log | Persists in production but browser-local/editable (disclosed) | **PARTIAL** |
| Webhook success | HTTP 200; POST + secret header received | **PASS** |
| Webhook failure | Clear CORS/unreachable message | **PASS** |
| Production persistence | Knowledge/approval survive two reloads | **PASS** |
| Dev persistence | Added records disappear after reload (reproduced 2×) | **FAIL** |
| Shared/cross-device records | Browser-local only; no backend/auth | **NOT IMPLEMENTED** |

### Palette detail
- Image 01 samples: `#FFFFFF, #E0E0FF, #E0FFFF, #E0FFE0, #A0A0A0`
- Image 06 samples: `#FFC0C0, #FFC0E0, #E04080, #FFE0E0, #E0E0E0`
- Both return: "At least one sampled image color is near a registered brand color."
- Because white/gray is registered and the distance threshold is loose, the pink off-brand post passes. The check does not identify the dominant palette or report drift.

### Approval detail
- Q4 item before: 82% "In review".
- After Approve: 100% "Approved".
- After Reject: 100% "Rejected".
- History: `Q4 product launch announcement | Rejected | 100%`.
- New queue items start at 0%, but approval always forces 100% (`Math.max(a.score, 100)`).

### Persistence detail
- **Production:** knowledge and the added approval survived two reloads.
- **Dev:** added knowledge and approval vanished on reload, twice. This is a React StrictMode effect race: the initial default-state write overwrites localStorage before hydration completes. It is environment-dependent but affects developers/demos run with `next dev`.

---

## 11. API and security

### API behaviour

| Test | Result | Status |
|---|---|---|
| `GET /api/audit` | 200 with engine metadata | **PASS** |
| Missing/blank/numeric draft | 400 clear error | **PASS** |
| Malformed JSON | 400 clear error, no stack in response | **PASS** |
| Custom guidelines honoured | Ignored; preset hijack | **FAIL** |
| Authentication | None; anonymous curl gets full report | **FAIL** |
| Rate limiting | 10 concurrent requests → all 200 in 8 ms | **FAIL** |
| Size limit | 100,000 words → 200 with **5,935,353-byte** response in 52 ms | **FAIL** |
| XSS payload | Safely escaped by React; not executed | **PASS** |
| Hardcoded secrets | 0 matches; no `.env` files | **PASS** |
| Security headers | None of CSP/XCTO/XFO/Referrer-Policy/HSTS/Permissions-Policy | **FAIL** |
| API key storage | Plaintext in `inkloom_shield_user_settings` | **FAIL** |
| API key transmission | Posted to `/api/audit`; forwarded to provider | **FAIL** |
| Invalid Gemini key | 200 with silent deterministic report; UI says "Connected" | **FAIL** |
| Live Gemini quality | No valid key | **BLOCKED** |
| Live Anthropic quality | No valid key | **BLOCKED** |
| Prompt injection | Live model unavailable | **NOT TESTED** |
| CORS policy | No deployment config tested | **NOT TESTED** |

### Response headers (production)
```
HTTP/1.1 200 OK
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept-Encoding
x-nextjs-cache: HIT
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000, stale-while-revalidate
ETag: "..."
Content-Type: text/html; charset=utf-8
```
No `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Strict-Transport-Security`, or `Permissions-Policy`.

### API-key claim vs reality
UI text: *"Stored in browser memory only — never sent to external servers."*

Actual:
- Stored plaintext in localStorage (`{"apiKey":"QA_FAKE_SECRET_abc123",...}`).
- Re-shown in the settings field after reload.
- Posted in the `/api/audit` request body.
- The server forwards it to Gemini/Anthropic.
- **Test Connection with a fake key returned "Connected to Gemini API successfully."** because the engine swallowed the provider error and returned the deterministic report.

This is both a privacy issue and a trust issue: the user cannot tell whether live AI is active.

### Positive
- No hardcoded API keys or `.env` files.
- React output escaping prevented the XSS payload from executing.
- API rejects missing/invalid payloads with 400 rather than crashing.
- Server error responses do not expose stack traces to the client (the server log does).

---

## 12. Accessibility and responsive behaviour

### axe-core WCAG 2 A/AA — color contrast

| Route | Nodes | Status | Examples |
|---|---|---|---|
| `/` | 12 | **FAIL** | 2.45:1 (`#94a3b8` on `#f8fafc`), 2.56:1 on white |
| `/workspace` | 45 | **FAIL** | Muted 10–11px labels and badges |
| `/creative-audit` | 1 | **FAIL** | 10px helper text |
| `/governance` | 10 | **FAIL** | 10px labels, muted card subtitles |

Total: **68 color-contrast violations**, all impact `serious`.

### Other accessibility findings

| Finding | Result | Status |
|---|---|---|
| Programmatic labels | Draft/guidelines/specs/settings inputs have no label, `aria-label`, or id-linked label; placeholders only | **FAIL** |
| Modal semantics | 0 `role="dialog"`, 0 `aria-modal="true"` | **FAIL** |
| Focus trap | Tab from Settings modal moves to "Load Demo Preset" behind overlay | **FAIL** |
| Escape closes modal | No; settings modal stays open | **FAIL** |
| Close button name | Icon-only close button has no `aria-label`/`title`/text | **FAIL** |
| Keyboard access to highlights | 3 `<mark>` elements, 0 focusable; click-only | **FAIL** |
| Skip link | None | **FAIL** |
| Main landmark | 0 `<main>` on workspace | **FAIL** |
| Basic keyboard nav | Links/buttons reachable, but modal and highlights fail | **PARTIAL** |
| Screen-reader verification | No NVDA/VoiceOver run | **NOT TESTED** |

### Responsive

| Viewport | Result |
|---|---|
| 390px landing | PASS — 390/390 |
| 390px creative | PASS — 390/390 |
| 390px governance | PASS — 390/390 |
| 390px workspace | **FAIL** — 461/390 overflow |
| 768px tablet | PASS — all routes |
| 1440px desktop | PASS — all routes |

### Not tested
- Firefox/Safari/WebKit.
- Lighthouse/Core Web Vitals.
- 200% zoom/reflow.
- Real screen reader.
- Reduced motion.

The app uses many 10–11px muted labels (`text-slate-400` on white) that fail contrast even at normal text sizes. This is systemic, not one bad token.

---

## 13. Issue register (P0–P3)

### P0-01 — Deterministic engine ignores user documents and substitutes preset reports
- **Severity:** Critical
- **Route/component:** `src/lib/auditEngine.ts`, `POST /api/audit`, `/workspace`, `/creative-audit`
- **Description:** The engine scans for trigger words and returns hardcoded FinVault/TechCorp/Aura reports. It does not use `guidelineText` or `specText`. Flagged text can be absent from the draft, citations are fabricated, and the original draft is replaced by preset copy.
- **Reproduction:** POST `{"draftText":"Smartwatch battery life is good.","guidelineText":"Never mention bananas.","specText":"Bananas are forbidden."}`. Response: TechCorp report at 46%, three TechCorp findings, none present in the draft; the custom guideline never appears. Repeat with `risk-free` (FinVault, 38%) and `aura` (Aura, 32%).
- **Expected:** Findings and citations derive from the submitted draft and supplied documents; draft preserved.
- **Actual:** Unrelated preset report, fabricated citations, draft replaced, custom guidance ignored.
- **Suggested fix:** Remove trigger-based preset routing from the audit path. Pass all three texts to one analyser. Presets should only load through an explicit "Load Demo Preset" action and must be labelled as demo. If analysis cannot run, return a typed error, never a fake report.
- **Evidence:** `trigger-results.json`, `api-tests-results.json`, `ui-tc-results.json`, TC-01–TC-09, CRE-01–CRE-05.

### P0-02 — Publication gate does not block unsafe export
- **Severity:** Critical
- **Route/component:** `ExportModal`, `/workspace`, governance status
- **Description:** No score threshold or unresolved-issue check prevents export. The exported status can claim approval with high-severity issues pending.
- **Reproduction:** (a) Load demo at 46% with 3 pending issues → Export opens and both downloads are offered. (b) Audit TC-04 at 87% with 1 high pending → JSON says `APPROVED_FOR_PUBLICATION`. (c) Apply All, edit the draft to reintroduce violations → score stays 100, Export stays enabled.
- **Expected:** Export/certificate blocked or clearly marked non-certified while high/critical issues remain; status recomputed on edit.
- **Actual:** Export is always allowed; status is inconsistent with pending issues.
- **Suggested fix:** Implement one server-side gate. Recompute on every draft change. Block certificate generation for unresolved high/critical issues or score below threshold. Use an explicit status enum (`BLOCKED`, `REVIEW_REQUIRED`, `APPROVED`) derived from issues, not stored text.
- **Evidence:** `export-demo-results.json`, `gate2-results.json`, `gate-results.json`, EXP-03/04, WS-07.

### P0-03 — Fake "cryptographic" hash and misleading certificate claims
- **Severity:** Critical
- **Route/component:** `src/components/ExportModal.tsx`, JSON/Markdown export
- **Description:** `cryptographicHash` is `sha256-inkloom-<random 10 chars>`, not a SHA-256. The `.md` header says "Verified & Remediated by Inkloom Shield" while issues are pending.
- **Reproduction:** Export TC-04 at 87% and demo at 69%; inspect `cryptographicHash` and the Markdown header.
- **Expected:** A real digest/signature over a canonical payload, or no cryptographic claim; accurate status wording.
- **Actual:** `sha256-inkloom-3lkg47qlaq`, `sha256-inkloom-x8i4eqeaoo`; "Verified & Remediated" with 3 pending issues.
- **Suggested fix:** Remove the word "cryptographic" and the `sha256-` prefix unless a real 64-hex digest is computed. Prefer server-side SHA-256/signature with key management. Add a visible "DRAFT — unresolved issues" watermark when applicable.
- **Evidence:** `gate2-results.json`, `export-demo-results.json`, EXP-05/06.

### P1-01 — API/network failure silently loads an unrelated demo report
- **Severity:** High
- **Route/component:** `src/app/page.tsx`, `/api/audit`, `/workspace`
- **Description:** On HTTP 500 or network abort, the landing page catches the failure, stores `TECHCORP_REPORT`, and navigates to `/workspace` with no error. The user's draft is discarded.
- **Reproduction:** Intercept `/api/audit` with 500 (and separately abort), submit a unique draft. Both land on `/workspace` showing TechCorp SmartWatch at 46%; submitted text is absent; no error banner.
- **Expected:** Error state, draft preserved, retry option; no fabricated result.
- **Actual:** Silent demo substitution.
- **Suggested fix:** Remove the demo fallback from the request path. Show an error with retry; keep the draft in state/localStorage and do not navigate.
- **Evidence:** `route-error-results.json`, `audit-error-http500.png`, `audit-error-abort.png`, FRM-08.

### P1-02 — Editing a remediated draft never re-audits
- **Severity:** High
- **Route/component:** `/workspace` draft editor
- **Description:** The editor writes directly to `report.currentDraftText` without re-running analysis. Score, issue list and publication status remain from the previous state.
- **Reproduction:** Apply All (100/Publication Ready), switch to Edit, append `Inkloom guarantees 100% accuracy and is safe for deep ocean scuba diving.` Wait. Score remains 100.
- **Expected:** Debounced re-audit or immediate invalidation of score/status.
- **Actual:** Stale 100% and exportable certificate.
- **Suggested fix:** On edit, mark report stale and disable export; run a debounced audit when the user saves/stops typing. Recompute issues and status from the new draft.
- **Evidence:** `gate-results.json`, `gate-reintroduce.png`, WS-07.

### P1-03 — Duplicate phrase remediation only fixes the first occurrence
- **Severity:** High
- **Route/component:** `handleApplyFix`, `/workspace`
- **Description:** `String.replace` replaces only the first occurrence but marks the issue resolved and declares full remediation.
- **Reproduction:** Audit `Our app is super cheap. Our app is super cheap.` Apply the fix. Result: `Our app is compelling value. Our app is super cheap.` Score 100, "Fully remediated".
- **Expected:** All flagged occurrences replaced, or residual occurrence remains flagged.
- **Actual:** 100% with a violation still in the draft.
- **Suggested fix:** Replace all occurrences (carefully, with offsets) or re-audit after each fix and keep the issue open until no occurrences remain.
- **Evidence:** `gate-results.json`, WS-08.

### P1-04 — Approvals unconditionally force a 100% trust score
- **Severity:** High
- **Route/component:** `/governance` Approval workflow
- **Description:** `setApprovalStatus` sets `score: Math.max(a.score, 100)` on approve; reject/return do not restore evidence. History can record a rejected item at 100%.
- **Reproduction:** Approve the 82% Q4 item → 100%. Reject it → still 100%; history shows "Rejected 100%".
- **Expected:** Approval requires evidence and does not invent a score; reject preserves the assessed score.
- **Actual:** Approval is a score-laundering button.
- **Suggested fix:** Remove score mutation. Store reviewer, timestamp, decision and evidence link separately. Approval should require all gates to pass; if overriding, record an explicit exception.
- **Evidence:** `governance-results.json`, GOV-09/10.

### P1-05 — API-key handling contradicts the UI and hides provider failure
- **Severity:** High
- **Route/component:** `SettingsModal`, `storage.ts`, `auditEngine.ts`
- **Description:** The UI says the key is "Stored in browser memory only — never sent to external servers." It is persisted in plaintext localStorage and posted to `/api/audit`, which forwards it to the provider. Test Connection reports success for an invalid key because fallback returns 200.
- **Reproduction:** Save `QA_FAKE_SECRET_abc123`, reload → key is still shown and present in localStorage. Submit an audit → request body contains the key. Enter `AIzaFAKE...` and click Test Connection → "Connected to Gemini API successfully."
- **Expected:** Accurate disclosure, no plaintext persistence, real provider validation.
- **Actual:** False claim, plaintext storage, false success.
- **Suggested fix:** Keep keys server-side only (env/secret store). If BYOK is required, use session-only memory and state that the key is sent to the provider. Make Test Connection call a provider-specific validation endpoint and surface the real error; never treat deterministic fallback as a successful connection.
- **Evidence:** `settings-results.json`, `settings-test-result.json`, `fake-key-response2.json`, SEC-12/13/16.

### P1-06 — API has no authentication, rate limit or size limit
- **Severity:** High
- **Route/component:** `POST /api/audit`
- **Description:** Anonymous callers can run unlimited audits. A 100,000-word draft returned a 5.9 MB response in 52 ms; 10 concurrent requests all returned 200. This enables resource exhaustion and unbounded provider cost.
- **Reproduction:** Send 10 concurrent POSTs → 10×200 in 8 ms. Send 100,000 words → 200, 5,935,353 bytes.
- **Expected:** Auth/tenant checks, request-body cap, output cap, rate limit, timeout.
- **Actual:** None.
- **Suggested fix:** Add auth and per-tenant rate limits at the edge; cap input (e.g. 20k chars) and output; reject oversized bodies with 413; add timeouts and concurrency controls.
- **Evidence:** `api-edge-results.json`, SEC-05/06/07.

### P1-07 — Missing security headers
- **Severity:** High
- **Route/component:** All routes / `next.config.mjs`
- **Description:** No CSP, nosniff, frame protection, Referrer-Policy, HSTS or Permissions-Policy; `X-Powered-By: Next.js` is exposed.
- **Reproduction:** `curl -I http://127.0.0.1:3100/` and inspect response.
- **Expected:** Baseline security headers.
- **Actual:** Only Next caching headers plus `X-Powered-By`.
- **Suggested fix:** Add headers in `next.config.mjs` or middleware: CSP (start report-only), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`/`frame-ancestors 'none'`, `Referrer-Policy`, HSTS in production, `Permissions-Policy`; disable `poweredByHeader`.
- **Evidence:** `headers.txt`, SEC-10.

### P1-08 — Mobile navigation is hidden with no alternative
- **Severity:** High
- **Route/component:** `Navbar`, all routes below 768px
- **Description:** The nav container is `display:none`; no hamburger or bottom nav exists. Mobile users cannot reach Workspace/Creative/Governance after leaving the landing page.
- **Reproduction:** Open any route at 390×844. All nav links are 0×0; no menu button exists.
- **Expected:** Accessible mobile menu or persistent navigation.
- **Actual:** Links hidden with no replacement.
- **Suggested fix:** Add a labelled hamburger button with a focus-trapped menu, or a mobile bottom bar. Ensure links have 44px targets.
- **Evidence:** `form-mobile-results.json`, `mobile_*.png`, NAV-10.

### P1-09 — Dev-mode governance data loss
- **Severity:** High
- **Route/component:** `/governance` localStorage effects
- **Description:** In `next dev`, adding a knowledge document or approval then reloading loses the new record. Reproduced twice. Production build persists correctly.
- **Reproduction:** `next dev` on 3001 → add "Persist Probe Doc" and "Persist Approval" → reload twice. Both disappear from state and localStorage. Same script against `next start` persists.
- **Expected:** Identical persistence in dev and production.
- **Actual:** Dev loses writes due to a StrictMode effect race.
- **Suggested fix:** Guard initial hydration writes (load once, then persist in an effect gated by a hydrated flag); avoid writing default state on first mount; add a storage version/migration.
- **Evidence:** `persist-dev-results-1.json`, `persist-dev-results-2.json`, `persist-prod-results.json`, GOV-16.

### P1-10 — Serious accessibility barriers
- **Severity:** High
- **Route/component:** All routes, modals, workspace highlights
- **Description:** 68 contrast violations; unlabeled form controls; modals lack dialog semantics, focus trap, Escape handling and accessible close names; violation highlights are mouse-only; no skip link; no main landmark on workspace.
- **Reproduction:** Run axe; open Settings and press Tab/Escape; inspect highlight `<mark>` elements.
- **Expected:** WCAG 2 A/AA compliance and keyboard operability.
- **Actual:** Multiple serious failures.
- **Suggested fix:** Raise muted text to ≥4.5:1; add labels/`aria-describedby`; add `role="dialog"`, `aria-modal`, labelled close, focus trap/restore, Escape; make highlights buttons or add keyboard handlers; add skip link and `<main>`.
- **Evidence:** `a11y-results.json`, `a11y-modal-results.json`, A11Y-01–13.

### P1-11 — PDF upload inserts raw PDF bytes instead of text
- **Severity:** High
- **Route/component:** Landing guideline/spec upload (`FileReader.readAsText`)
- **Description:** PDFs are accepted but read as text, so the textarea receives `%PDF-1.4 ... xref` binary syntax.
- **Reproduction:** Upload `sample.pdf` via guideline upload. Guideline textarea starts with `%PDF-1.4` and contains 595 chars of PDF structure.
- **Expected:** Extracted text or a clear "PDF parsing not supported" rejection.
- **Actual:** Garbage input silently fed to the audit.
- **Suggested fix:** Use a PDF parser server-side (e.g. pdfjs/unpdf) and validate extracted text; or remove `.pdf` from `accept` and tell users to paste text.
- **Evidence:** `form-mobile-results.json`, `pdf-upload-after.png`, FRM-05.

### P1-12 — Generic whole-draft tone flag produces false positives
- **Severity:** High
- **Route/component:** Deterministic engine
- **Description:** Every unrecognised draft gets a 94% TONE_MISMATCH covering the entire text, including safe and compliant copy. This makes the score and issue list untrustworthy even when no preset trigger fires.
- **Reproduction:** Audit TC-01, TC-09, or creative 01/04. All get 94% and a tone flag on the whole sentence.
- **Expected:** No finding on compliant copy; targeted findings on specific spans.
- **Actual:** Blanket false positive.
- **Suggested fix:** Replace the catch-all tone rule with evidence-based checks: sentence-level heuristics, guideline matching, and explicit "no issues found" output. Do not flag an entire draft without a specific violated rule.
- **Evidence:** `api-tests-results.json`, `creative-matrix.json`, TC-01/09, CRE-01/04.

### P2-01 — No visual/logo/color verification (disclosed)
- **Severity:** Medium
- **Route/component:** `/creative-audit`
- **Description:** OCR and computer vision are explicitly not implemented; the test pack's color/visual cases cannot pass.
- **Reproduction:** Upload creative 06 (pink) and run the audit. No color signal is produced.
- **Expected:** At minimum, a color-palette review signal or a clear "visual review required" gate.
- **Actual:** Copy-only audit; visual requirement unmet.
- **Suggested fix:** Do not claim visual governance until implemented. Add a mandatory manual visual checklist with reviewer attestation, or integrate a palette/logo check.
- **Evidence:** `creative-matrix.json`, `palette-results.json`, TC-10, CRE-06.

### P2-02 — Palette sampler gives misleading matches
- **Severity:** Medium
- **Route/component:** `/governance` Visual & WCAG
- **Description:** Quantized top-5 colors are compared with a loose distance threshold; because white/gray is registered, both the navy and pink creatives "match". Dominant-color drift is not detected.
- **Reproduction:** Upload 01 and 06, click Sample image palette. Both return "near a registered brand color"; 06's dominant pinks are ignored.
- **Expected:** Compare dominant colors and report the closest match/distance per color, with a drift verdict.
- **Actual:** Any image containing white/gray passes.
- **Suggested fix:** Exclude neutrals or report coverage percentages; compare each dominant color to the nearest approved color; show distance and coverage; flag when dominant colors are unapproved.
- **Evidence:** `palette-results.json`, `palette-01.png`, `palette-06.png`, GOV-07.

### P2-03 — Governance CRUD is destructive and not versioned
- **Severity:** Medium
- **Route/component:** Knowledge library, asset register, approval queue
- **Description:** Deletes happen immediately without confirmation. "Edit in form" copies values into the create form; saving creates a duplicate Version 1 instead of updating/incrementing.
- **Reproduction:** Edit "Master Brand Voice" → save → two records, both Version 1. Delete an asset/approval → count drops instantly, no dialog.
- **Expected:** Confirmation, undo, in-place versioned edits.
- **Actual:** Duplicate records and irreversible deletes.
- **Suggested fix:** Add confirm dialogs/undo; implement edit-by-id with version increment and change history; soft-delete.
- **Evidence:** `governance-results.json`, GOV-03/04/06/11.

### P2-04 — "Submit to Brand Lead" is a no-op
- **Severity:** Medium
- **Route/component:** `GuidelineAmbiguityModal`
- **Description:** The button shows "Submitted!" and closes, but writes nothing to governance, history, or an API.
- **Reproduction:** Workspace → Generate Rule Proposal → Submit to Brand Lead. Modal closes; approvals/history remain 0; no network request.
- **Expected:** Create a review item or explicitly state it is a demo.
- **Actual:** False success.
- **Suggested fix:** POST to a governance endpoint and create an approval item, or relabel as "Copy RFC" only and remove the fake submit.
- **Evidence:** `extras-results.json`, FRM-16.

### P2-05 — Score inconsistency and broken Apply All output
- **Severity:** Medium
- **Route/component:** `/workspace`
- **Description:** Demo starts at hardcoded 46%; recalculation gives 69% for the same 3 pending issues, 81% after one fix, 69% after revert. Apply All produces a run-on sentence.
- **Reproduction:** Load demo → 46%; Apply one fix → 81%; Revert → 69%. Apply All → 100% with `...at $199 features IP67...`.
- **Expected:** One deterministic scoring function over current state; grammatical rewrites.
- **Actual:** Inconsistent baseline and broken copy.
- **Suggested fix:** Compute the initial score from issues, not a preset constant. Add punctuation/joining logic and review generated text; test fixtures for scoring.
- **Evidence:** `export-demo-results.json`, `applyall-results.json`, WS-04/09.

### P2-06 — Lint is failing and bypassed; no automated tests
- **Severity:** Medium
- **Route/component:** Build pipeline
- **Description:** `npm run lint` fails; `next build` skips linting; no test suite exists.
- **Reproduction:** Run lint (exit 1) and build (log: "Skipping linting").
- **Expected:** Lint blocks CI; regression tests cover audit, remediation, export and storage.
- **Actual:** Lint is advisory only; zero tests.
- **Suggested fix:** Fix the apostrophe, replace `<img>` or suppress with justification, remove `ignoreDuringBuilds`, add unit tests for engine/scoring and Playwright smoke tests for core flows.
- **Evidence:** `lint.log`, `build.log`, BLD-03/04/07.

### P2-07 — Critical/high dependency vulnerabilities
- **Severity:** Medium (High if deployed)
- **Route/component:** Dependencies
- **Description:** 5 vulnerabilities, including critical `next` and high `postcss`; production tree still has 2.
- **Reproduction:** `npm audit` / `npm audit --omit=dev`.
- **Expected:** No high/critical advisories, or documented risk acceptance.
- **Actual:** 1 critical + 4 high; fix requires Next 16.4.3 (major).
- **Suggested fix:** Plan a Next 16 upgrade with regression testing; track advisories; do not run `audit fix --force` blindly.
- **Evidence:** `audit.json`, `audit-prod.json`, BLD-05/06.

### P2-08 — Workspace horizontal overflow on mobile
- **Severity:** Medium
- **Route/component:** `/workspace` toolbar
- **Description:** 461px content in a 390px viewport; toolbar title and flag badge overflow.
- **Reproduction:** Open workspace at 390×844; measure `document.documentElement.scrollWidth`.
- **Expected:** No horizontal scroll.
- **Actual:** 71px overflow.
- **Suggested fix:** Add `min-w-0` to flex children, use `max-w-full`/`truncate`, allow the toolbar to wrap.
- **Evidence:** `overflow-results.json`, `mobile_workspace.png`, NAV-11.

### P2-09 — Governance is browser-local and the "immutable-style" log is editable
- **Severity:** Medium
- **Route/component:** `/governance` storage
- **Description:** Records are localStorage-only; no shared backend, identity, or append-only guarantee. The UI discloses this, but it cannot support real approvals.
- **Reproduction:** Use another browser profile/device → defaults only. Inspect localStorage → records editable.
- **Expected:** Shared, authenticated, tamper-evident governance records.
- **Actual:** Local demo state.
- **Suggested fix:** Move to a server database with auth, audit log, signatures and role checks; keep localStorage only as a demo cache.
- **Evidence:** `persist-*.json`, `governance page disclosure`, GOV-12/17.

### P3-01 — Unbranded default 404
- **Severity:** Low
- **Route/component:** `not-found`
- **Description:** Unknown routes show Next's default 404 with no branding or navigation.
- **Reproduction:** Open `/does-not-exist`.
- **Expected:** Branded 404 with links back.
- **Actual:** Default page.
- **Suggested fix:** Add `app/not-found.tsx`.
- **Evidence:** `desktop_nonexistent-route.png`, `route-error-results.json`.

### P3-02 — All pages share one title
- **Severity:** Low
- **Route/component:** Metadata
- **Description:** `/`, `/workspace`, `/creative-audit`, `/governance` all use "Inkloom Shield // Intelligent Brand-Governance & Remediation Firewall".
- **Reproduction:** Read `document.title` on each route.
- **Expected:** Route-specific titles.
- **Actual:** Identical titles (404 has its own).
- **Suggested fix:** Add per-route metadata (`export const metadata` or `generateMetadata`).
- **Evidence:** `route-error-results.json`.

### P3-03 — Unoptimized `<img>` warnings
- **Severity:** Low
- **Route/component:** Creative audit preview, governance visual preview
- **Description:** Two ESLint `@next/next/no-img-element` warnings.
- **Reproduction:** Run lint.
- **Expected:** `next/image` or documented exception (blob previews may justify `<img>`).
- **Actual:** Warnings.
- **Suggested fix:** Use `next/image` with `unoptimized` for blob previews, or add targeted disable comments with rationale.
- **Evidence:** `lint.log`, BLD-03.

### P3-04 — Server logs full provider stack traces
- **Severity:** Low
- **Route/component:** API server
- **Description:** Invalid-key requests log full `ApiError` stack traces. No key was observed in the sample, but stack traces increase log noise and can leak internals.
- **Reproduction:** Send an invalid Gemini key; inspect `prod-server.log`.
- **Expected:** Structured, redacted error logging.
- **Actual:** Full stack trace with SDK internals.
- **Suggested fix:** Log a correlation ID plus sanitized error code; keep stack traces in a protected debug channel.
- **Evidence:** `prod-server.log`, SEC-11.

---

## 14. Fix plan, retest results and limitations

### Recommended order

| Priority | Work | Effort |
|---|---|---|
| 1 | Replace preset routing with document-grounded analysis; preserve draft; label demo data (P0-01) | L |
| 2 | Implement one server-side publication gate and recompute on edit (P0-02, P1-02) | M |
| 3 | Remove fake hash and misleading certificate claims (P0-03) | S |
| 4 | Fail loudly on API/network/provider errors; no demo substitution (P1-01, P1-05) | S |
| 5 | Fix key handling, storage, disclosure and Test Connection (P1-05) | M |
| 6 | Add auth/rate/size limits and security headers (P1-06, P1-07) | M |
| 7 | Fix duplicate-phrase remediation and scoring consistency (P1-03, P2-05) | S |
| 8 | Fix mobile nav and workspace overflow (P1-08, P2-08) | S |
| 9 | Fix dev persistence race (P1-09) | S |
| 10 | Accessibility remediation (P1-10) | M |
| 11 | PDF parsing or rejection (P1-11) | S |
| 12 | Replace blanket tone flag with evidence-based checks (P1-12) | M |
| 13 | Governance versioning/deletes/approval integrity (P1-04, P2-03, P2-09) | M |
| 14 | Visual/palette review or explicit manual gate (P2-01, P2-02) | M |
| 15 | Remove fake RFC submit (P2-04) | S |
| 16 | Lint/tests/dependency upgrade (P2-06, P2-07) | M–L |
| 17 | P3 polish (404, titles, images, logging) | S |

### Retest results
| Item | Initial | Retest | Conclusion |
|---|---|---|---|
| Tone slider Corporate selection | Ambiguous (state stayed balanced) | Scoped click on first slider → `strict`, Corporate preview, persisted | **PASS** — earlier result was a selector error |
| Dev governance persistence | Suspected data loss | Reproduced twice: records vanish after reload | **CONFIRMED FAIL** |
| Production governance persistence | Suspected pass | Two reloads preserved knowledge + approval | **CONFIRMED PASS** |
| PDF upload | Suspected raw bytes | 595 chars starting `%PDF-1.4`, contains `xref` | **CONFIRMED FAIL** |
| Security headers | Suspected missing | Header dump shows none; `X-Powered-By` present | **CONFIRMED FAIL** |
| TC-02 guarantee detection | Suspected false negative | "guarantees 100% accuracy" produced only generic tone flag | **CONFIRMED FAIL** |
| Palette sampling | Suspected false match | Both navy and pink images matched via white/gray | **CONFIRMED FAIL** |
| WCAG checker math | Suspected correct | 13.24:1, 6.12:1, 17.85:1, 4.77:1 match formula | **PASS** |

### Audit limitations
- **Live AI:** No valid Gemini/Anthropic key or `.env` file. Live model quality, prompt adherence, prompt injection, latency and provider-specific errors could not be verified. Invalid-key behavior was tested.
- **Synthetic data only:** Test pack and webhook payloads are synthetic; no real customer or production data was used.
- **Webhook:** Local receiver only; no external/CORS production endpoint, signing, retries or delivery guarantees.
- **Browser coverage:** Chromium only. Firefox/Safari/WebKit, mobile Safari and touch gestures were not tested.
- **Accessibility:** axe-core plus scripted keyboard checks only; no NVDA/VoiceOver, zoom/reflow, reduced-motion or cognitive testing.
- **Performance/security depth:** No Lighthouse, load test, penetration test, SAST/DAST, dependency exploit validation, or infrastructure review.
- **Environment:** Dev/prod behavior was tested on one macOS machine with Node 26. The dev persistence race may vary by React/Next version.
- **No source changes:** Findings are observational. Suggested fixes are recommendations, not implemented patches.

### Conclusion
Inkloom Shield is a visually strong prototype with working navigation, uploads, remediation UI, exports, local webhooks and a correct contrast calculator. It is not a trustworthy governance product yet: the core audit is a preset router, the publication gate is cosmetic, and the certificate makes cryptographic claims it cannot support. The highest-value work is to delete the fake-success paths, make the engine actually read the supplied documents, and put a real server-side gate in front of export. Only then should the team invest in visual analysis, integrations and polish.

---

## Appendix A — Evidence index

All evidence is in `qa-report/evidence/`. Key files:

| File | Contents |
|---|---|
| `api-tests-results.json` | 10 test-pack cases through the API |
| `ui-tc-results.json` | 10 test-pack cases through the UI |
| `creative-matrix.json` | 6 creative images with copy, score, flags |
| `trigger-results.json` | Preset hijack proof (risk-free/smartwatch/aura) |
| `api-edge-results.json` | 400s, XSS, fake key, 5.9 MB response, concurrency |
| `gate-results.json`, `gate2-results.json` | Edit/re-audit and 87% approval proof |
| `export-demo-results.json` | 46→81→69 scores, MD/JSON export, fake hash |
| `governance-results.json` | Approvals, versioning, deletes |
| `palette-results.json` | Palette sampling for creatives 01/06 |
| `contrast-results.json` | WCAG ratios |
| `persist-dev-results-*.json`, `persist-prod-results.json` | Dev vs prod persistence |
| `a11y-results.json`, `a11y-modal-results.json` | axe and modal/keyboard findings |
| `form-mobile-results.json` | Validation, PDF upload, mobile nav/overflow |
| `route-error-results.json` | Route status, console errors, API-failure fallback |
| `webhook-test-result.json`, `webhook-received.json` | Webhook POST/secret/payload |
| `settings-results.json`, `settings-test-result.json` | Key persistence and false "Connected" |
| `build.log`, `lint.log`, `tsc.log`, `audit.json`, `audit-prod.json` | Tooling results |
| `headers.txt` | Production response headers |
| `secret-scan.txt` | Secret scan (0 matches, no `.env`) |
| `*.png` | Desktop/tablet/mobile, modals, errors, exports, accessibility |

Evidence was captured from the production build on port 3100 unless a file name says dev. The QA-started dev/prod servers and local webhook receiver were stopped after capture.
