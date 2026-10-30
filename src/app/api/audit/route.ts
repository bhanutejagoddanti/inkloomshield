import { NextRequest, NextResponse } from 'next/server';
import { runDualEngineAudit, LiveProviderError } from '@/lib/auditEngine';
import { getSecurityHeaders, validateAuditInput, rateLimitRequest, checkSameOrigin, AUDIT_MAX_BYTES } from '@/lib/apiSecurity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > AUDIT_MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: `Audit request exceeds the ${Math.round(AUDIT_MAX_BYTES / 1024)} KB limit.` },
      { status: 413, headers: { 'Retry-After': '60' } },
    );
  }

  const rateLimit = rateLimitRequest(req, 'audit', 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Audit rate limit exceeded. Retry after the indicated delay.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + rateLimit.retryAfterSeconds)),
        },
      },
    );
  }

  if (!checkSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: 'This audit endpoint requires a same-origin request or an authenticated session.' },
      { status: 401, headers: { 'Retry-After': '0' } },
    );
  }

  try {
    const body = await req.json();
    const validation = validateAuditInput(body?.draftText, body?.guidelineText, body?.specText);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status, headers: { 'X-RateLimit-Remaining': String(19 - Math.max(0, Date.now() % 60000)) } },
      );
    }

    const report = await runDualEngineAudit({
      draftText: body.draftText,
      guidelineText: body.guidelineText,
      specText: body.specText,
      guidelineName: body.guidelineName,
      specName: body.specName,
      apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
      provider: body.provider === 'anthropic' ? 'anthropic' : 'gemini',
    });

    return NextResponse.json(
      {
        success: true,
        report,
        rateLimit: {
          limit: 20,
          remaining: 19,
        },
      },
      { status: 200, headers: { 'X-RateLimit-Limit': '20', 'X-RateLimit-Remaining': '19' } },
    );
  } catch (error) {
    const status = error instanceof LiveProviderError ? error.status : 500;
    const message = error instanceof LiveProviderError ? error.message : 'The governance audit could not be completed.';
    if (error instanceof LiveProviderError) {
      console.warn(`[audit] live provider rejected request with status ${status}`);
    } else {
      console.error('[audit] deterministic engine failed:', error);
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: status, headers: { 'X-RateLimit-Remaining': '19' } },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      engine: 'Inkloom Shield Dual-Engine Governance Firewall',
      supportedModels: ['gemini-2.5-flash', 'claude-3-5-sonnet-latest'],
      features: [
        'Document-grounded deterministic review',
        'Optional live AI provider',
        'Intent-preserving tone slider',
        'Guideline ambiguity detector',
      ],
    },
    { status: 200, headers: getSecurityHeaders() },
  );
}
