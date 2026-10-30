# 🛡️ Inkloom Shield — Intelligent Brand-Governance & Remediation Firewall

> **Round 2 High-Stakes Hackathon Project**  
> An active pre-publication firewall checking content drafts against approved brand guidelines and product fact sheets before publication.

---

## 🌟 Executive Summary & Problem Statement

Modern enterprise marketing teams produce hundreds of content pieces weekly across blogs, product releases, ads, and PR collaterals. However:
1. **Factual Exaggerations & Hallucinations:** Writers routinely exaggerate battery metrics, misstate MSRP pricing, or make unapproved durability claims (e.g., claiming splash-proof devices can be used for deep-sea scuba diving).
2. **Brand Voice Drift:** Traditional automated spell/tone checkers strip all marketing excitement, reducing high-converting copy to sterile corporate jargon.
3. **Repeated Blame on Writers:** When multiple writers make the same mistake, teams blame the writer rather than identifying that **the underlying Brand Guideline rule itself is vague or contradictory.**

**Inkloom Shield** solves all three problems by acting as an intelligent firewall with grounded citations, an intent-preserving tone slider, and macro guideline ambiguity detection.

---

## 🎯 Key Capabilities & Architecture

```
                                  ┌─────────────────────────────┐
                                  │   Unverified Content Draft  │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
       ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
       │ Approved Brand Manual │   │ Dual-Engine LLM & Rule    │   │ Technical Spec Sheets │
       │ (Voice, Tone, Policy) │   │ Governance Firewall       │   │ (MSRP, Battery, IP67) │
       └───────────────────────┘   └─────────────┬─────────────┘   └───────────────────────┘
                                                 │
                                                 ▼
             ┌───────────────────────────────────────────────────────────────────────┐
             │            Interactive Side-by-Side Remediation Workspace             │
             │                                                                       │
             │  • Left: Inline Colored Highlights (Red = Fact, Amber = Tone, Purple) │
             │  • Right: Grounded Spec Citations (Page & Section numbers)            │
             │  • Tone Slider: [Persuasive Hook] | [Balanced Brand] | [Strict Corp]  │
             │  • Real-Time Brand Trust Score Gauge (0% -> 100% Recalculation)       │
             │  • Macro Insight Banner: Generates AI-Drafted Rule RFCs for Managers  │
             └───────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 1-Click Judge Demo Preset (Zero-Auth Testing)

For instant judging without requiring API keys or authentication:
- Click the prominent **`⚡ Load Judge Demo Preset`** button on the home page or in the workspace navbar.
- Pre-loaded with a realistic product launch draft containing 3 intentional, grounded errors:
  1. **Factual Error:** Fake battery life (*"lasts a full 48 hours on a single charge"* vs. official *Up to 24 hours under standard usage* in `TechCorp_Specs.pdf, Page 2, §4.1`).
  2. **Tone Mismatch:** Prohibited discount slang (*"is super cheap at just $149!"* vs. premium brand posture & official *$199 MSRP* in `Brand_Voice_Guide.pdf, Page 4, §1.2 & §3.2`).
  3. **Critical Liability Factual Error:** Fatal water immersion claim (*"You can even wear it while diving in deep ocean waters!"* vs. official *IP67 splash-proof only* in `TechCorp_Specs.pdf, Page 3, §5.2`).
- A high-fidelity deterministic engine guarantees instant response even if external API limits or offline judging conditions occur.

---

## 🏆 Jury-Shocking Unique Feature 1: "Intent-Preserving Tone Slider"

Traditional checkers replace marketing flair with bland corporate jargon. When a user reviews a flagged issue, Inkloom Shield provides a **3-way Tone Slider**:
- **🔥 [Persuasive Hook]**: High-conversion, punchy, exciting phrasing that preserves sales energy while remaining 100% truthful.
- **⚖️ [Balanced Brand]**: Modern, empowering, professional signature brand voice.
- **🏛️ [Strict Corporate]**: Formal, legally airtight, risk-averse phrasing for financial or regulatory filings.

Users select their preferred tone before clicking **"Apply Fix Live"**, which updates the draft text in real time and recalculates the **Brand Trust Score**.

---

## 💡 Jury-Shocking Unique Feature 2: "Guideline Flaw & Ambiguity Detector" (Macro Insight)

Instead of merely blaming the copywriter, Inkloom Shield monitors whether recurring draft errors stem from an ambiguous guideline rule.
- If repeated violations trace back to a vague rule (e.g., Section 3.2 on pricing disclosures), a top **Meta-Insight Banner** alerts the team:
  > *💡 Meta-Insight: Guideline Ambiguity Detected: Section 3.2 of your Brand Guidelines regarding pricing disclosures is unclear. Click here to generate a clarified rule proposal for your Brand Manager.*
- Clicking the banner opens the **AI Clarification Proposal Modal**, featuring:
  - Root-cause friction analysis.
  - Side-by-side comparative diff: Original Ambiguous Rule vs. AI-Drafted Rule Amendment RFC.
  - 1-click **"Copy RFC Amendment"** and **"Submit to Brand Lead"** workflow.

---

## 📊 Live Brand Trust Score Gauge

- Dynamic animated circular SVG gauge (0% to 100%).
- Real-time score recalculation as issues are resolved or reverted.
- Tri-metric breakdown:
  - **Factual Accuracy**
  - **Tone & Voice Alignment**
  - **Policy & Legal Compliance**
- Confetti celebration blast (`canvas-confetti`) when the score reaches 100% and unlocks the **Publication Gate**.
- **Certified Export:** Copy clean remediated draft, download Markdown (`.md`), or export tamper-evident cryptographic audit certificate (`.json`).

---

## 🛠️ Tech Stack & SDK Integration

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom cyber-governance aesthetic
- **Icons:** Lucide React
- **AI Engine:**
  - Google Gemini API (`@google/genai`)
  - Anthropic Claude SDK (`@anthropic-ai/sdk`)
  - Graceful High-Fidelity Deterministic Fallback Engine (Zero-Auth guarantee)
- **Visuals & Polish:** Canvas Confetti, SVG Circular Dial, Animated Step Stepper

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in browser
http://localhost:3000
```


## Round 3 — Governance Hub

A new `/governance` workspace adds the Round 3 demo modules:

- **Brand knowledge library:** create, import text-based documents, approve/draft status, organize source content, and export records.
- **Visual asset register:** register logos, palettes, typography and other approved references; preview uploaded images and sample their dominant colors against registered hex colors.
- **WCAG contrast checker:** calculate contrast ratio for chosen foreground/background colors, preview the pair, and show AA/AAA thresholds.
- **Approval workflow:** submit content for review, approve/reject/return items, and record decisions in an audit-history view.
- **Governance overview:** show document/asset/review counts, pending work and simple guideline wording signals.
- **CMS webhook testing:** configure a receiver, send a sample event from the browser, and export a sample payload for CMS integrations.
- **Exports:** download governance records and decision history as JSON.

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/governance` or use the **Governance Hub** navigation link.

### Important implementation notes

This Round 3 workspace currently uses browser `localStorage` for its records. Data is not shared across browsers/users and is not a production database. The webhook tester sends a browser request, so the receiver must allow CORS; a server-side signed webhook should replace this for production. The image feature previews files and samples approximate colors; it does not claim to identify a logo with computer vision. Contrast checking is deterministic for the two selected solid colors but does not automatically audit every pixel of an image. WordPress and HubSpot are integration targets, not preconfigured native connectors. Human review remains necessary for legal/compliance decisions.


## Round 3: Creative Audit upload

Open `/creative-audit` to upload a PNG, JPG, WEBP, or GIF advertisement, poster, flyer, or social-media creative (up to 10 MB). The page previews the image and audits the marketing copy entered by the user against supplied brand guidelines and product specifications. **Automatic OCR and AI vision-based logo/layout/color verification are not implemented in this version**; users must paste/type the image text, and visual checks remain a future enhancement.
