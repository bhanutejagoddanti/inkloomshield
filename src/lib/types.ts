export type AuditIssueType = 
  | 'FACTUAL_ERROR' 
  | 'TONE_MISMATCH' 
  | 'GUIDELINE_AMBIGUITY' 
  | 'GUIDELINE_CONFLICT'
  | 'VISUAL_MISMATCH';

export type ToneStyle = 'hook' | 'balanced' | 'strict';

export interface AuditIssue {
  id: string;
  type: AuditIssueType;
  severity: 'high' | 'medium' | 'low';
  flaggedText: string;
  explanation: string;
  citation: string;
  groundedSourceQuote: string;
  guidelineSectionRef?: string;
  suggestedFixes: {
    hook: string;
    balanced: string;
    strict: string;
  };
  selectedTone?: ToneStyle;
  isResolved?: boolean;
  appliedFix?: string;
  ruleId?: string;
}

export interface MacroInsight {
  hasAmbiguity: boolean;
  title: string;
  ruleSection: string;
  description: string;
  affectedCount: number;
  originalRuleText: string;
  proposedAmendment: string;
  rationale: string;
}

export interface AuditReport {
  id: string;
  timestamp: string;
  draftTitle: string;
  initialDraftText: string;
  currentDraftText: string;
  brandGuidelineTitle: string;
  productSpecTitle: string;
  initialScore: number;
  currentScore: number;
  scoreBreakdown: {
    factualAccuracy: number;
    toneAlignment: number;
    guidelineCompliance: number;
  };
  issues: AuditIssue[];
  macroInsight?: MacroInsight;
  auditSummary: string;
  wordCount: number;
  readingTimeMinutes: number;
  guidelineText?: string;
  specText?: string;
  guidelineName?: string;
  specName?: string;
  engine?: 'deterministic' | 'gemini' | 'anthropic';
  requiresReaudit?: boolean;
}

export interface PresetScenario {
  id: string;
  title: string;
  badge: string;
  category: string;
  description: string;
  draftText: string;
  guidelinesText: string;
  specsText: string;
  guidelineDocName: string;
  specDocName: string;
  report: AuditReport;
}
