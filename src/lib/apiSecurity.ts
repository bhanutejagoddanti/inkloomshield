import { NextRequest } from 'next/server';

const RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();

export const AUDIT_MAX_BYTES = 1024 * 1024;
export const MAX_DRAFT_WORDS = 5000;
export const MAX_DOCUMENT_CHARS = 100000;

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://api.anthropic.com https://cdn.jsdelivr.net https://tessdata.projectnaptha.com",
      "worker-src 'self' blob: https://cdn.jsdelivr.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
  };
}

export function rateLimitRequest(req: NextRequest, scope: string, limit = 20, windowMs = 60_000): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const key = `${scope}:${req.ip ?? 'unknown'}`;
  const bucket = RATE_LIMITS.get(key);
  if (!bucket || now > bucket.resetAt) {
    RATE_LIMITS.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function checkSameOrigin(req: NextRequest): boolean {
  const authToken = process.env.INKLOOM_API_TOKEN;
  if (authToken) {
    const [scheme, credentials] = req.headers.get('authorization')?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || credentials !== authToken) return false;
    return true;
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  const allowed = req.nextUrl.host === host;

  if (origin) {
    try {
      if (new URL(origin).host === req.nextUrl.host) return true;
    } catch {
      // Ignore malformed origins and fall through to the host check.
    }
  }

  const fetchSite = req.headers.get('sec-fetch-site');
  const allowedByFetch = fetchSite === 'same-origin' || fetchSite === 'same-site';
  return allowedByFetch && allowed;
}

export function validateAuditInput(draftText: unknown, guidelineText: unknown, specText: unknown) {
  if (typeof draftText !== 'string' || !draftText.trim()) {
    return { ok: false as const, status: 400, error: 'draftText is required to perform a governance audit.' };
  }
  if (draftText.trim().split(/\s+/).filter(Boolean).length > MAX_DRAFT_WORDS) {
    return { ok: false as const, status: 413, error: `draftText exceeds the ${MAX_DRAFT_WORDS}-word audit limit.` };
  }

  const guideline = typeof guidelineText === 'string' ? guidelineText.trim() : '';
  const spec = typeof specText === 'string' ? specText.trim() : '';
  if (guideline.length > MAX_DOCUMENT_CHARS || spec.length > MAX_DOCUMENT_CHARS) {
    return { ok: false as const, status: 413, error: `Uploaded reference documents must be ${MAX_DOCUMENT_CHARS} characters or smaller.` };
  }

  if (draftText.length > AUDIT_MAX_BYTES || guideline.length > AUDIT_MAX_BYTES || spec.length > AUDIT_MAX_BYTES) {
    return { ok: false as const, status: 413, error: `Audit input exceeds the ${Math.round(AUDIT_MAX_BYTES / 1024)} KB limit.` };
  }

  return { ok: true as const };
}
