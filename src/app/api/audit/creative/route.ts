import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { AuditReport, AuditIssue } from '@/lib/types';

export const dynamic = 'force-dynamic';
// Max 15MB for base64 image requests
const CREATIVE_MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > CREATIVE_MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Creative image exceeds the 15 MB upload limit.' },
      { status: 413, headers: { 'Retry-After': '60' } },
    );
  }

  const rateLimit = rateLimitRequest(req, 'creative-audit', 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Creative audit rate limit exceeded. Retry in a moment.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!checkSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized request origin.' },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    let rawImage = typeof body?.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : 'image/png';
    const guidelineText = typeof body?.guidelineText === 'string' ? body.guidelineText.trim() : '';
    const specText = typeof body?.specText === 'string' ? body.specText.trim() : '';
    const userApiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';

    if (!rawImage) {
      return NextResponse.json(
        { success: false, error: 'No image provided. Please upload an advertisement or creative.' },
        { status: 400 },
      );
    }

    // Strip data URL scheme if present (e.g. data:image/png;base64,...)
    if (rawImage.includes(',')) {
      rawImage = rawImage.split(',')[1];
    }

    const effectiveKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key is required for multimodal creative audit. Configure GEMINI_API_KEY or enter your key in settings.',
        },
        { status: 400 },
      );
    }

    const prompt = buildCreativeAuditPrompt(guidelineText, specText);
    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: rawImage,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response for this creative.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      const match = response.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse Gemini audit response.');
      parsed = JSON.parse(match[0]);
    }

    const report: AuditReport = formatCreativeAuditResponse(parsed, guidelineText, specText);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('[creative-audit] error:', error);
    const message = error instanceof Error ? error.message : 'Unable to complete creative audit with Gemini.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

function buildCreativeAuditPrompt(guidelineText: string, specText: string): string {
  const guidelinesBlock = guidelineText ? `APPROVED BRAND GUIDELINES:\n"""\n${guidelineText}\n"""` : 'APPROVED BRAND GUIDELINES: Not provided. Apply industry-standard brand governance, truth-in-advertising, and accessibility norms.';
  const specsBlock = specText ? `APPROVED PRODUCT SPECIFICATIONS & CLAIMS:\n"""\n${specText}\n"""` : 'APPROVED PRODUCT SPECIFICATIONS: Not provided. Flag any unverified performance claims, absolute guarantees, or unsupported pricing.';

  return `You are Inkloom Shield, an advanced AI-powered brand-governance and creative firewall.
You are auditing an uploaded marketing creative (advertisement, social media banner, flyer, or poster) against the approved Brand Guidelines and Product Specifications.

${guidelinesBlock}

${specsBlock}

AUDIT INSTRUCTIONS:
1. Examine the image carefully. Extract and transcribe ALL marketing text, headlines, offers, claims, buttons, badges, and disclaimers shown in the creative into "extractedText".
2. Inspect the visual presentation, color palette, logo integrity, typography, and layout. Note any visual observations in "visualObservations".
3. Evaluate every claim, phrase, tone element, and color against the approved Brand Guidelines and Product Specifications:
   - FACTUAL_ERROR: False, unsupported, or contradictory specifications, unapproved discounts, fake guarantees, or non-existent capabilities.
   - TONE_MISMATCH: Slang, hyperbole, extreme superlatives (e.g., "World's #1", "insanely epic"), pushy or fear-based language.
   - VISUAL_MISMATCH: Off-brand colors (outside approved hex palette), improper logo usage, low contrast, or unapproved badge designs.
   - GUIDELINE_AMBIGUITY or GUIDELINE_CONFLICT: Unclear policy rules or conflicting guidance.
4. For every flagged issue, provide:
   - "flaggedText": The exact text or visual element from the image.
   - "explanation": Why it violates the guidelines or specifications.
   - "citation": The relevant section/heading from the brand guidelines or product specs.
   - "groundedSourceQuote": Exact quote from the approved brand guidelines or specs that governs this.
   - "suggestedFixes": Three tone-aligned rewrite/remedy proposals:
       * "hook": High-converting, punchy marketing alternative that remains truthful.
       * "balanced": Professional signature brand tone.
       * "strict": Conservative, legally risk-averse phrasing.
5. Compute Brand Trust Scores (0 to 100):
   - "factualAccuracy": 100 minus severity-weighted penalties for factual/claim violations.
   - "toneAlignment": 100 minus severity-weighted penalties for tone/superlative violations.
   - "guidelineCompliance": 100 minus severity-weighted penalties for visual/guideline violations.
   - "currentScore": Overall weighted score (round to whole number between 0 and 100).
6. Provide an executive "auditSummary" explaining overall readiness and primary risks.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "draftTitle": "Creative: <headline or descriptive title>",
  "extractedText": "all transcribed copy from image",
  "visualObservations": "summary of visual elements, dominant colors, and layout observed",
  "auditSummary": "concise executive summary of audit findings",
  "currentScore": 75,
  "scoreBreakdown": {
    "factualAccuracy": 80,
    "toneAlignment": 70,
    "guidelineCompliance": 75
  },
  "issues": [
    {
      "id": "creative-issue-1",
      "type": "FACTUAL_ERROR",
      "severity": "high",
      "flaggedText": "exact text or element",
      "explanation": "clear explanation",
      "citation": "Brand Guidelines -> Section Name",
      "groundedSourceQuote": "approved rule quote",
      "suggestedFixes": {
        "hook": "punchy fix",
        "balanced": "balanced fix",
        "strict": "strict fix"
      }
    }
  ]
}`;
}

function formatCreativeAuditResponse(parsed: any, guidelineText: string, specText: string): AuditReport {
  const issues: AuditIssue[] = Array.isArray(parsed?.issues)
    ? parsed.issues.map((raw: any, index: number) => ({
        id: String(raw.id || `creative-issue-${index + 1}`),
        type: validateIssueType(raw.type),
        severity: raw.severity === 'high' || raw.severity === 'medium' || raw.severity === 'low' ? raw.severity : 'medium',
        flaggedText: String(raw.flaggedText || 'Flagged element'),
        explanation: String(raw.explanation || 'Governance rule violation detected.'),
        citation: String(raw.citation || 'Brand Guidelines'),
        groundedSourceQuote: String(raw.groundedSourceQuote || 'Approved brand guidance.'),
        suggestedFixes: {
          hook: String(raw.suggestedFixes?.hook || raw.suggestedFixes?.balanced || raw.flaggedText || ''),
          balanced: String(raw.suggestedFixes?.balanced || raw.suggestedFixes?.hook || raw.flaggedText || ''),
          strict: String(raw.suggestedFixes?.strict || raw.suggestedFixes?.balanced || raw.flaggedText || ''),
        },
        selectedTone: 'balanced',
        isResolved: false,
      }))
    : [];

  const factual = clampScore(parsed?.scoreBreakdown?.factualAccuracy ?? 100);
  const tone = clampScore(parsed?.scoreBreakdown?.toneAlignment ?? 100);
  const compliance = clampScore(parsed?.scoreBreakdown?.guidelineCompliance ?? 100);
  const overall = clampScore(parsed?.currentScore ?? Math.round(factual * 0.45 + tone * 0.3 + compliance * 0.25));

  const extractedText = String(parsed?.extractedText || '');
  const visualObservations = String(parsed?.visualObservations || '');

  return {
    id: `audit-creative-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    draftTitle: String(parsed?.draftTitle || 'Marketing Creative Review'),
    initialDraftText: extractedText || 'Visual marketing creative',
    currentDraftText: extractedText || 'Visual marketing creative',
    brandGuidelineTitle: 'Approved Brand Guidelines',
    productSpecTitle: 'Product Specifications',
    initialScore: overall,
    currentScore: overall,
    scoreBreakdown: {
      factualAccuracy: factual,
      toneAlignment: tone,
      guidelineCompliance: compliance,
    },
    issues,
    auditSummary: String(parsed?.auditSummary || 'Creative audit completed.'),
    wordCount: extractedText.trim().split(/\s+/).filter(Boolean).length,
    readingTimeMinutes: 1,
    guidelineText,
    specText,
    engine: 'gemini',
    visualObservations,
    extractedText,
  };
}

function validateIssueType(type: any): AuditIssue['type'] {
  const validTypes = ['FACTUAL_ERROR', 'TONE_MISMATCH', 'GUIDELINE_AMBIGUITY', 'GUIDELINE_CONFLICT', 'VISUAL_MISMATCH'];
  return validTypes.includes(type) ? type : 'GUIDELINE_CONFLICT';
}

function clampScore(score: any): number {
  const n = Number(score);
  if (isNaN(n)) return 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}

