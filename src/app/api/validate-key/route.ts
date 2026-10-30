import { NextRequest, NextResponse } from 'next/server';
import { validateProviderKey } from '@/lib/providerValidation';
import { checkSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimit = rateLimitRequest(req, 'validate-key', 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Provider connection test rate limit exceeded.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!checkSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: 'This provider test endpoint requires a same-origin request or an authenticated session.' },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  const provider = body.provider === 'anthropic' ? 'anthropic' : 'gemini';

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'An API key is required to test the selected provider connection.' },
      { status: 400 },
    );
  }

  try {
    const result = await validateProviderKey(apiKey, provider);
    return NextResponse.json({
      success: true,
      data: result,
      rateLimit: { limit: 10, remaining: 9 },
    });
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as { status?: unknown }).status) || 502 : 502;
    const message = error instanceof Error ? error.message : 'The provider connection test failed.';
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
