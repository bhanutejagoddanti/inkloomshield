import { AuditReport } from './types';
import { TECHCORP_REPORT } from './demoData';
import { calculateScore } from './auditEngine';

const STORAGE_KEY = 'inkloom_shield_active_report';
const SETTINGS_KEY = 'inkloom_shield_user_settings';
const SESSION_KEY = 'inkloom_shield_user_api_key';

export interface UserSettings {
  apiKey: string;
  provider: 'gemini' | 'anthropic';
  autoScrollHighlight: boolean;
  hapticFeedback: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '',
  provider: 'gemini',
  autoScrollHighlight: true,
  hapticFeedback: true,
};

export function getStoredReport(): AuditReport {
  if (typeof window === 'undefined') return TECHCORP_REPORT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return TECHCORP_REPORT;
    const report = JSON.parse(raw) as AuditReport;
    const score = calculateScore(report.issues);
    return {
      ...report,
      initialScore: report.initialScore || score.overall,
      currentScore: report.currentScore || score.overall,
      scoreBreakdown: {
        factualAccuracy: report.scoreBreakdown?.factualAccuracy || score.factual,
        toneAlignment: report.scoreBreakdown?.toneAlignment || score.tone,
        guidelineCompliance: report.scoreBreakdown?.guidelineCompliance || score.compliance,
      },
      requiresReaudit: report.requiresReaudit ?? false,
    };
  } catch {
    return TECHCORP_REPORT;
  }
}

export function saveStoredReport(report: AuditReport): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
  } catch {
    // Storage can be unavailable (private mode, quota, embedded webviews).
  }
}

export function getStoredSettings(): UserSettings {
  const defaults = { ...DEFAULT_SETTINGS, apiKey: '' };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const stored = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    const apiKey = readSessionKey();
    return {
      apiKey,
      provider: stored.provider || DEFAULT_SETTINGS.provider,
      autoScrollHighlight: stored.autoScrollHighlight ?? DEFAULT_SETTINGS.autoScrollHighlight,
      hapticFeedback: stored.hapticFeedback ?? DEFAULT_SETTINGS.hapticFeedback,
    };
  } catch {
    return { ...defaults, apiKey: readSessionKey() };
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  const persisted: UserSettings = {
    ...settings,
    apiKey: '',
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(persisted));
  } catch {
    // Ignore persistence failures.
  }
  if (settings.apiKey) {
    try {
      sessionStorage.setItem(SESSION_KEY, settings.apiKey);
    } catch {
      // Ignore session storage failures; the key is never written to disk/localStorage.
    }
  }
}

export function clearStoredSessionKey(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore.
  }
}

function readSessionKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}
