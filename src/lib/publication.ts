import { AuditReport } from './types';

export type PublicationStatus = 'BLOCKED' | 'REVIEW_REQUIRED' | 'APPROVED_FOR_PUBLICATION';

export interface PublicationGate {
  ready: boolean;
  status: PublicationStatus;
  requiresReaudit: boolean;
  unresolvedIssues: number;
  highSeverityOpenIssues: number;
  reason: string;
}

export function getPublicationGate(report: AuditReport): PublicationGate {
  const unresolvedIssues = report.issues.filter((issue) => !issue.isResolved);
  const highSeverityOpenIssues = unresolvedIssues.filter(
    (issue) => issue.severity === 'high',
  ).length;

  if (report.requiresReaudit) {
    return {
      ready: false,
      status: 'BLOCKED',
      requiresReaudit: true,
      unresolvedIssues: unresolvedIssues.length,
      highSeverityOpenIssues,
      reason: 'The draft has changed since the last audit. Run a fresh audit before publishing or exporting.',
    };
  }

  if (unresolvedIssues.length > 0) {
    const firstOpen = unresolvedIssues[0];
    return {
      ready: false,
      status: 'REVIEW_REQUIRED',
      requiresReaudit: false,
      unresolvedIssues: unresolvedIssues.length,
      highSeverityOpenIssues,
      reason: `${unresolvedIssues.length} audit issue${unresolvedIssues.length === 1 ? '' : 's'} remain open. Remediate or approve review before export.`,
    };
  }

  return {
    ready: true,
    status: 'APPROVED_FOR_PUBLICATION',
    requiresReaudit: false,
    unresolvedIssues: 0,
    highSeverityOpenIssues: 0,
    reason: 'All audit issues are resolved.',
  };
}
