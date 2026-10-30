import { AuditReport, PresetScenario } from './types';

export const DEFAULT_DRAFT = `The new TechCorp SmartWatch lasts a full 48 hours on a single charge and is super cheap at just $149! You can even wear it while diving in deep ocean waters!`;

export const DEFAULT_SPECS = `PRODUCT FACT SHEET: TechCorp SmartWatch Pro (Model TC-900)
- Battery Life: Up to 24 hours under standard active usage (Single-cell Li-Po 420mAh). Standby up to 36 hours in ultra-power saver mode. (TechCorp_Specs.pdf, Page 2, §4.1)
- MSRP Pricing: Starting price is $199 USD (Standard Band) / $249 USD (Titanium Milanese). No introductory tier below $199. (TechCorp_Specs.pdf, Page 1, §2.0)
- Water Resistance: IP67 Ingress Protection certified. Protected against dust ingress and immersion in freshwater up to 1 meter for maximum 30 minutes. NOT certified for ocean scuba diving, saltwater exposure, or high-velocity watersports. (TechCorp_Specs.pdf, Page 3, §5.2)
- Sensors: Optical Heart Rate Gen 3, SpO2 sensor, Skin Temperature gauge, Dual-frequency GPS.`;

export const DEFAULT_GUIDELINES = `BRAND & VOICE GOVERNANCE MANUAL (v3.2) - TechCorp Global
1.0 Brand Personality & Posture:
- We speak with authority, empowerment, and refined optimism.
- Prohibited Tone: Avoid discount/flea-market colloquialisms such as "dirt cheap", "super cheap", "steal of a deal", or "bargain basement". Frame value through innovation and everyday utility.
2.0 Technical Accuracy & Consumer Protection:
- All battery claims must reflect typical mixed-use cycle (up to 24 hours). Never quote extreme standby duration without explicit caveat.
- Ingress claims must state "IP67 water resistance" and strictly forbid implying open-water scuba diving or marine water sports.
3.2 Pricing & Value Disclosures:
- Rule Statement: All public marketing copy must explicitly display baseline MSRP ($199) and clarify regional tax exclusions. Promotional or promotional-bundle claims must not obscure regular retail baseline. (Note: Current rule ambiguity exists regarding bundle versus standalone discounts).`;

export const TECHCORP_REPORT: AuditReport = {
  id: 'audit-demo-techcorp',
  timestamp: new Date().toISOString(),
  draftTitle: 'TechCorp SmartWatch Launch Announcement Draft',
  initialDraftText: DEFAULT_DRAFT,
  currentDraftText: DEFAULT_DRAFT,
  brandGuidelineTitle: 'TechCorp_Brand_Voice_Guide_2026.pdf',
  productSpecTitle: 'TechCorp_Hardware_Specs_v4.1.pdf',
  initialScore: 46,
  currentScore: 46,
  scoreBreakdown: {
    factualAccuracy: 35,
    toneAlignment: 45,
    guidelineCompliance: 58,
  },
  auditSummary: 'High-risk compliance triggers detected. 2 severe factual contradictions regarding battery endurance and marine depth rating, along with 1 brand voice tone breach and an underlying guideline ambiguity in Section 3.2.',
  wordCount: 26,
  readingTimeMinutes: 0.2,
  macroInsight: {
    hasAmbiguity: true,
    title: 'Guideline Ambiguity Detected in Section 3.2',
    ruleSection: 'Brand Manual Section 3.2 (Pricing & Value Disclosures)',
    description: 'Section 3.2 of your Brand Guidelines regarding pricing disclosures is unclear. It prohibits discount colloquialisms but fails to provide approved phrasing for entry-tier positioning, leading 3+ copywriting drafts this sprint to trigger compliance alerts.',
    affectedCount: 3,
    originalRuleText: 'Rule 3.2: All public marketing copy must explicitly display baseline MSRP ($199) and clarify regional tax exclusions. Promotional or promotional-bundle claims must not obscure regular retail baseline.',
    proposedAmendment: 'Proposed Rule Revision v3.2.1: "Marketing drafts must reference the official baseline MSRP of $199 USD using approved value frameworks (e.g., \'exceptional value starting at $199\', \'flagship capability at $199\'). Prohibit adjectives such as \'super cheap\' or \'dirt cheap\'. When quoting promotional bundles, footnote the standard MSRP."',
    rationale: 'Clarifying the exact permitted value formulations will eliminate copywriter ambiguity and reduce brand review cycle latency by an estimated 65% across marketing and PR pipelines.'
  },
  issues: [
    {
      id: 'issue-1',
      type: 'FACTUAL_ERROR',
      severity: 'high',
      flaggedText: 'lasts a full 48 hours on a single charge',
      explanation: 'Exaggerates battery duration by 100%. Product specification sheet specifies standard battery life is up to 24 hours.',
      citation: 'TechCorp_Specs.pdf, Page 2, §4.1',
      groundedSourceQuote: 'Battery Life: Up to 24 hours under standard active usage (Single-cell Li-Po 420mAh). Standby up to 36 hours in ultra-power saver mode only.',
      guidelineSectionRef: 'Section 2.0: Technical Accuracy',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'delivers an uncompromising full 24 hours of non-stop intelligence',
        balanced: 'provides up to 24 hours of reliable all-day battery life on a single charge',
        strict: 'is rated for up to 24 hours of continuous operational battery life under standard conditions'
      }
    },
    {
      id: 'issue-2',
      type: 'TONE_MISMATCH',
      severity: 'medium',
      flaggedText: 'is super cheap at just $149!',
      explanation: 'Violates brand voice policy against discount slang ("super cheap") and misstates the starting MSRP ($199 starting price, not $149).',
      citation: 'TechCorp_Brand_Voice_Guide_2026.pdf, Page 4, §1.2 & Specs.pdf Page 1, §2.0',
      groundedSourceQuote: 'Prohibited Tone: Avoid discount/flea-market colloquialisms such as "super cheap". Frame value through innovation. MSRP is $199.',
      guidelineSectionRef: 'Section 3.2: Pricing Disclosures',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'delivers flagship innovation at an accessible starting investment of $199',
        balanced: 'offers compelling premium value starting at $199',
        strict: 'is available at an introductory manufacturer suggested retail price of $199'
      }
    },
    {
      id: 'issue-3',
      type: 'FACTUAL_ERROR',
      severity: 'high',
      flaggedText: 'You can even wear it while diving in deep ocean waters!',
      explanation: 'Critical liability hazard. Device has IP67 splash rating (max 1m freshwater for 30m). Scuba diving or saltwater immersion will cause catastrophic water ingress and void warranty.',
      citation: 'TechCorp_Specs.pdf, Page 3, §5.2',
      groundedSourceQuote: 'IP67 Ingress Protection certified... NOT certified for ocean scuba diving, saltwater exposure, or high-velocity watersports.',
      guidelineSectionRef: 'Section 2.0: Ingress Protection',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'engineered to conquer high-sweat sessions and heavy rain with IP67 water resistance',
        balanced: 'features IP67 water and splash resistance built for your active everyday lifestyle',
        strict: 'is certified with IP67 ingress protection for freshwater splash and rain resistance'
      }
    }
  ]
};

export const AURA_HEALTH_DRAFT = `Aura AI Clinical Assistant guarantees 100% cure for anxiety and is totally free forever with zero privacy strings attached. Just talk to our bot and skip going to real doctors!`;

export const AURA_HEALTH_SPECS = `AURA HEALTH AI - PRODUCT COMPLIANCE SPECIFICATION
- Medical Classification: Wellness Support & Psychoeducation Tool (Non-diagnostic, non-prescriptive, Class I exempt).
- Regulatory Statement: "Aura is designed for supportive cognitive exercises and does not diagnose, treat, cure, or prevent any clinical disorder." (Aura_Compliance_Doc.pdf, Page 1)
- Pricing & Data Governance: Standard tier is free with optional $14.99/mo AuraPlus subscription. HIPAA-compliant encryption with zero ad-brokerage data sharing. (Aura_Data_Charter.pdf, Page 4)`;

export const AURA_HEALTH_GUIDELINES = `AURA HEALTH BRAND INTEGRITY GUIDELINES
- Clinical Boundary: Never use definitive medical promises like "guarantees cure", "replaces your therapist", or "skip going to doctors".
- Ethical Tone: Empathetic, scientifically grounded, collaborative with licensed practitioners.
- Section 4.1 Medical Disclaimer: Every public promotional copy must include a disclaimer clarifying that Aura supplements rather than replaces certified healthcare providers.`;

export const AURA_HEALTH_REPORT: AuditReport = {
  id: 'audit-demo-aura',
  timestamp: new Date().toISOString(),
  draftTitle: 'Aura Health Mobile Wellness Ad Copy',
  initialDraftText: AURA_HEALTH_DRAFT,
  currentDraftText: AURA_HEALTH_DRAFT,
  brandGuidelineTitle: 'Aura_Brand_Integrity_v2.pdf',
  productSpecTitle: 'Aura_Clinical_Compliance_Spec.pdf',
  initialScore: 32,
  currentScore: 32,
  scoreBreakdown: {
    factualAccuracy: 20,
    toneAlignment: 30,
    guidelineCompliance: 45,
  },
  auditSummary: 'Severe regulatory and liability hazard. Claims of "100% cure" and urging patients to "skip real doctors" trigger instant FDA/FTC medical governance violations.',
  wordCount: 27,
  readingTimeMinutes: 0.2,
  macroInsight: {
    hasAmbiguity: true,
    title: 'Guideline Ambiguity Detected in Section 4.1',
    ruleSection: 'Brand Integrity Manual Section 4.1 (Medical Disclaimers)',
    description: 'Section 4.1 does not state whether short-form social advertisements require the full 40-word medical disclaimer or an approved short-form badge.',
    affectedCount: 4,
    originalRuleText: 'Section 4.1: Every public promotional copy must include a disclaimer clarifying that Aura supplements rather than replaces certified healthcare providers.',
    proposedAmendment: 'Proposed Rule Revision v4.1.2: "For character-constrained channels (<280 chars), allow the standardized micro-badge: \'Aura supports wellness and does not replace medical advice. Consult your doctor.\' For long-form copy, retain the complete Section 4.1 paragraph."',
    rationale: 'Prevents copywriters from omitting disclaimers entirely due to lack of character-budget guidelines.'
  },
  issues: [
    {
      id: 'aura-issue-1',
      type: 'FACTUAL_ERROR',
      severity: 'high',
      flaggedText: 'guarantees 100% cure for anxiety',
      explanation: 'Unlawful medical cure claim. Aura AI is a supportive wellness tool and cannot claim to cure mental health conditions.',
      citation: 'Aura_Compliance_Doc.pdf, Page 1',
      groundedSourceQuote: 'Aura is designed for supportive cognitive exercises and does not diagnose, treat, cure, or prevent any clinical disorder.',
      guidelineSectionRef: 'Section 4.1: Medical Disclaimer',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'empowers you with science-backed mindfulness practices to navigate daily anxiety',
        balanced: 'provides evidence-based mindfulness tools to help manage daily stress and anxiety',
        strict: 'offers non-clinical cognitive reflection tools designed to assist in managing daily stress'
      }
    },
    {
      id: 'aura-issue-2',
      type: 'TONE_MISMATCH',
      severity: 'medium',
      flaggedText: 'is totally free forever with zero privacy strings attached',
      explanation: 'Informal colloquialism and mischaracterizes pricing model (Freemium with AuraPlus tier).',
      citation: 'Aura_Data_Charter.pdf, Page 4 & Brand Voice §2.1',
      groundedSourceQuote: 'Standard tier is free with optional $14.99/mo AuraPlus subscription. Adheres to HIPAA privacy standards.',
      guidelineSectionRef: 'Section 2.1: Data Governance',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'protects your personal journey with zero-ad, HIPAA-grade data privacy at zero starting cost',
        balanced: 'offers a free foundational tier with rigorous HIPAA-compliant privacy protections',
        strict: 'provides complimentary baseline access backed by verified HIPAA-compliant data security'
      }
    },
    {
      id: 'aura-issue-3',
      type: 'FACTUAL_ERROR',
      severity: 'high',
      flaggedText: 'skip going to real doctors!',
      explanation: 'Critical liability. Advising users to avoid licensed healthcare professionals violates state and federal health marketing regulations.',
      citation: 'Aura_Compliance_Doc.pdf, Page 1 & Guideline §1.0',
      groundedSourceQuote: 'Collaborative with licensed practitioners. Never urge patients to forgo clinical consultation.',
      guidelineSectionRef: 'Section 1.0: Clinical Boundary',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'works hand-in-hand with your professional healthcare routine',
        balanced: 'conveniently complements the ongoing guidance of your healthcare provider',
        strict: 'serves as an adjunct resource alongside qualified clinical medical professionals'
      }
    }
  ]
};

export const FINVAULT_DRAFT = `FinVault High-Yield Savings delivers a guaranteed 14.5% risk-free APY with instant federal deposit protection for unlimited balances up to $10 Million.`;

export const FINVAULT_SPECS = `FINVAULT NEOBANK PRODUCT SPEC SHEET
- Current APY: Variable 4.85% APY as of current rate schedule. Rates are subject to market adjustments and Federal Reserve benchmark. (FinVault_RateSheet.pdf, Page 1)
- FDIC Insurance: Insured up to statutory limits of $250,000 per depositor through our partner bank, Evolve Bank & Trust (Member FDIC). Extended sweep network provides coverage up to $2.5 Million max. (FinVault_Charter.pdf, Page 3)`;

export const FINVAULT_GUIDELINES = `FINVAULT FINANCIAL COMMUNICATIONS POLICY
- Prohibited Claims: Never describe savings interest as "guaranteed" or "risk-free" without noting variable rate mechanics.
- Deposit Limits: Never claim coverage exceeding verified sweep network limit ($2.5M).
- Section 5.3 APY Disclosures: All promotional copy featuring APY numbers must denote "Variable APY accurate as of [Date]".`;

export const FINVAULT_REPORT: AuditReport = {
  id: 'audit-demo-finvault',
  timestamp: new Date().toISOString(),
  draftTitle: 'FinVault Q4 Wealth Campaign',
  initialDraftText: FINVAULT_DRAFT,
  currentDraftText: FINVAULT_DRAFT,
  brandGuidelineTitle: 'FinVault_Compliance_Manual_2026.pdf',
  productSpecTitle: 'FinVault_Treasury_Specs.pdf',
  initialScore: 38,
  currentScore: 38,
  scoreBreakdown: {
    factualAccuracy: 25,
    toneAlignment: 40,
    guidelineCompliance: 50,
  },
  auditSummary: 'Immediate regulatory intervention required. APY inflated to 14.5% (actual is 4.85%), falsely promised as "risk-free", and FDIC insurance overclaimed to $10M.',
  wordCount: 22,
  readingTimeMinutes: 0.15,
  macroInsight: {
    hasAmbiguity: true,
    title: 'Guideline Ambiguity Detected in Section 5.3',
    ruleSection: 'Financial Communications Policy Section 5.3 (Rate Disclosures)',
    description: 'Section 5.3 requires variable APY date tags but does not state required placement for video or banner assets.',
    affectedCount: 3,
    originalRuleText: 'Section 5.3: All promotional copy featuring APY numbers must denote "Variable APY accurate as of [Date]".',
    proposedAmendment: 'Proposed Rule Revision v5.3.1: "For video/display assets, rate disclaimers must be displayed in a high-contrast legible font at >=12pt for at least 3 seconds or permanently visible in the final lockup."',
    rationale: 'Ensures SEC/CFPB scrutiny compliance while giving designers concrete layout specifications.'
  },
  issues: [
    {
      id: 'fin-issue-1',
      type: 'FACTUAL_ERROR',
      severity: 'high',
      flaggedText: 'guaranteed 14.5% risk-free APY',
      explanation: 'Severe financial fraud trigger. APY is variable 4.85%, not 14.5%, and cannot be declared "risk-free" under banking regulations.',
      citation: 'FinVault_RateSheet.pdf, Page 1',
      groundedSourceQuote: 'Current APY: Variable 4.85% APY as of current rate schedule. Rates are subject to market adjustments.',
      guidelineSectionRef: 'Section 5.3: APY Disclosures',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'accelerates your savings with an industry-leading 4.85% variable APY',
        balanced: 'earns a competitive 4.85% variable APY designed to grow your capital',
        strict: 'offers a variable annual percentage yield of 4.85% subject to rate schedule adjustments'
      }
    },
    {
      id: 'fin-issue-2',
      type: 'FACTUAL_ERROR',
      severity: 'high',
      flaggedText: 'instant federal deposit protection for unlimited balances up to $10 Million',
      explanation: 'FDIC statutory coverage is $250k, sweep network max is $2.5M. Claiming $10M is false advertising.',
      citation: 'FinVault_Charter.pdf, Page 3',
      groundedSourceQuote: 'Insured up to $250,000 per depositor... Extended sweep network provides coverage up to $2.5 Million.',
      guidelineSectionRef: 'Section 5.1: Deposit Insurance',
      selectedTone: 'balanced',
      isResolved: false,
      suggestedFixes: {
        hook: 'safeguards your capital with extended FDIC sweep protection up to $2.5 Million',
        balanced: 'provides FDIC insurance coverage up to $2.5 Million via our partner sweep program',
        strict: 'is eligible for up to $2.5 Million in aggregate FDIC pass-through insurance through partner depository institutions'
      }
    }
  ]
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'techcorp-smartwatch',
    title: 'TechCorp SmartWatch Pro',
    badge: 'Hardware Launch',
    category: 'Consumer Electronics',
    description: 'Catches battery exaggeration (48h vs 24h), discount slang ($149 vs $199 MSRP), and fatal scuba diving claim (IP67 only).',
    draftText: DEFAULT_DRAFT,
    specsText: DEFAULT_SPECS,
    guidelinesText: DEFAULT_GUIDELINES,
    guidelineDocName: 'TechCorp_Brand_Voice_Guide_2026.pdf',
    specDocName: 'TechCorp_Specs_v4.1.pdf',
    report: TECHCORP_REPORT
  },
  {
    id: 'aura-health',
    title: 'Aura AI Clinical Assistant',
    badge: 'HealthTech & HIPAA',
    category: 'Healthcare AI',
    description: 'Intercepts illegal medical cure claims, doctor avoidance statements, and character-constrained disclaimer ambiguity.',
    draftText: AURA_HEALTH_DRAFT,
    specsText: AURA_HEALTH_SPECS,
    guidelinesText: AURA_HEALTH_GUIDELINES,
    guidelineDocName: 'Aura_Brand_Integrity_v2.pdf',
    specDocName: 'Aura_Compliance_Doc.pdf',
    report: AURA_HEALTH_REPORT
  },
  {
    id: 'finvault-neobank',
    title: 'FinVault High-Yield Treasury',
    badge: 'FinTech & FDIC',
    category: 'Financial Services',
    description: 'Catches fabricated 14.5% APY, false "risk-free" guarantee, and $10M insurance claim exceeding FDIC statutory sweep limits.',
    draftText: FINVAULT_DRAFT,
    specsText: FINVAULT_SPECS,
    guidelinesText: FINVAULT_GUIDELINES,
    guidelineDocName: 'FinVault_Compliance_Manual.pdf',
    specDocName: 'FinVault_Treasury_Specs.pdf',
    report: FINVAULT_REPORT
  }
];
