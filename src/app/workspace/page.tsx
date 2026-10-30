'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Navbar } from '@/components/Navbar';
import { ScoreGauge } from '@/components/ScoreGauge';
import { ToneSlider } from '@/components/ToneSlider';
import { GuidelineAmbiguityModal } from '@/components/GuidelineAmbiguityModal';
import { ExportModal } from '@/components/ExportModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AuditReport, AuditIssue, MacroInsight, ToneStyle } from '@/lib/types';
import { getPublicationGate } from '@/lib/publication';
import {
  getStoredReport,
  saveStoredReport,
  getStoredSettings,
  saveStoredSettings,
  UserSettings,
} from '@/lib/storage';
import { calculateScore } from '@/lib/auditEngine';
import { TECHCORP_REPORT, DEFAULT_GUIDELINES, DEFAULT_SPECS } from '@/lib/demoData';
import {
  Lightbulb,
  CheckCircle2,
  Undo2,
  FileText,
  Edit3,
  Eye,
  Download,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Check,
  Zap,
} from 'lucide-react';

export default function WorkspacePage() {
  const [report, setReport] = useState<AuditReport>(TECHCORP_REPORT);
  const [activeIssueId, setActiveIssueId] = useState<string | null>('issue-1');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [editorMode, setEditorMode] = useState<'highlights' | 'edit'>('highlights');
  const [isReauditing, setIsReauditing] = useState(false);
  const [reauditError, setReauditError] = useState('');
  const [showAmbiguityModal, setShowAmbiguityModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());
  const [expandedCitations, setExpandedCitations] = useState<{ [id: string]: boolean }>({
    'issue-1': true, 'issue-2': true, 'issue-3': true,
  });
  const cardRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const loaded = getStoredReport();
    if (loaded) {
      setReport(loaded);
      if (loaded.issues.length > 0) setActiveIssueId(loaded.issues[0].id);
    }
    setSettings(getStoredSettings());
  }, []);

  const updateReportState = (newReport: AuditReport) => {
    setReport(newReport);
    saveStoredReport(newReport);
  };

  const handleSelectTone = (issueId: string, tone: ToneStyle) => {
    const updatedIssues = report.issues.map((issue) =>
      issue.id === issueId ? { ...issue, selectedTone: tone } : issue
    );
    updateReportState({ ...report, issues: updatedIssues });
  };

  const handleApplyFix = (issue: AuditIssue) => {
    const activeTone = issue.selectedTone || 'balanced';
    const fixText = issue.suggestedFixes[activeTone] || issue.suggestedFixes.balanced;
    const currentDraft = report.currentDraftText;
    const newDraft = currentDraft.includes(issue.flaggedText)
      ? currentDraft.split(issue.flaggedText).join(fixText)
      : currentDraft.replace(new RegExp(escapeRegExp(issue.flaggedText), 'gi'), fixText);

    const updatedIssues = report.issues.map((i) =>
      i.id === issue.id ? { ...i, isResolved: true, appliedFix: fixText } : i
    );
    const newScores = calculateScore(updatedIssues);
    const newReport: AuditReport = {
      ...report,
      currentDraftText: newDraft,
      currentScore: newScores.overall,
      scoreBreakdown: {
        factualAccuracy: newScores.factual,
        toneAlignment: newScores.tone,
        guidelineCompliance: newScores.compliance,
      },
      issues: updatedIssues,
    };
    updateReportState(newReport);

    if (newScores.overall === 100 || updatedIssues.every((i) => i.isResolved)) {
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#6366f1', '#f59e0b'] });
      } catch {}
    }
  };

  const handleRevertFix = (issue: AuditIssue) => {
    if (!issue.appliedFix) return;
    const revertedDraft = report.currentDraftText.split(issue.appliedFix || '').join(issue.flaggedText);
    const updatedIssues = report.issues.map((i) =>
      i.id === issue.id ? { ...i, isResolved: false, appliedFix: undefined } : i
    );
    const newScores = calculateScore(updatedIssues);
    updateReportState({
      ...report,
      currentDraftText: revertedDraft,
      currentScore: newScores.overall,
      scoreBreakdown: { factualAccuracy: newScores.factual, toneAlignment: newScores.tone, guidelineCompliance: newScores.compliance },
      issues: updatedIssues,
    });
  };

  const handleResolveAll = () => {
    let text = report.currentDraftText;
    const updatedIssues = report.issues.map((issue) => {
      const activeTone = issue.selectedTone || 'balanced';
      const fixText = issue.suggestedFixes[activeTone] || issue.suggestedFixes.balanced;
      if (text.includes(issue.flaggedText)) text = text.split(issue.flaggedText).join(fixText);
      return { ...issue, isResolved: true, appliedFix: fixText };
    });
    const newScores = calculateScore(updatedIssues);
    updateReportState({
      ...report, currentDraftText: text, currentScore: newScores.overall,
      scoreBreakdown: { factualAccuracy: newScores.factual, toneAlignment: newScores.tone, guidelineCompliance: newScores.compliance },
      issues: updatedIssues,
    });
    try { confetti({ particleCount: 130, spread: 90, origin: { y: 0.5 } }); } catch {}
  };

  const handleResetToInitial = () => {
    const updatedIssues = report.issues.map((i) => ({ ...i, isResolved: false, appliedFix: undefined }));
    const newScores = calculateScore(updatedIssues);
    updateReportState({
      ...report,
      currentDraftText: report.initialDraftText,
      currentScore: newScores.overall,
      scoreBreakdown: { factualAccuracy: newScores.factual, toneAlignment: newScores.tone, guidelineCompliance: newScores.compliance },
      issues: updatedIssues,
      requiresReaudit: false,
    });
  };

  const submitGovernanceProposal = (insight: MacroInsight) => {
    // Governance rule-amendment proposals require human (Brand Committee) review.
    // Capture the RFC submission locally until a committee review endpoint exists.
    if (typeof window === 'undefined') return;
    try {
      const key = 'inkloom_round3_hub_proposals';
      const stored = window.localStorage.getItem(key);
      const proposals: unknown[] = stored ? JSON.parse(stored) : [];
      window.localStorage.setItem(key, JSON.stringify([...(Array.isArray(proposals) ? proposals : []), { ...insight, submittedAt: new Date().toISOString() }]));
    } catch {
      // Ignore persistence failures (private mode, quota exceeded).
    }
  };

  const handleHighlightClick = (issueId: string) => {
    setActiveIssueId(issueId);
    const el = cardRefs.current[issueId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleCitation = (issueId: string) => {
    setExpandedCitations((prev) => ({ ...prev, [issueId]: !prev[issueId] }));
  };

  const filteredIssues = report.issues.filter((issue) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'RESOLVED') return issue.isResolved;
    if (filterType === 'UNRESOLVED') return !issue.isResolved;
    return issue.type === filterType;
  });

  const unresolvedCount = report.issues.filter((i) => !i.isResolved).length;
  const resolvedCount = report.issues.filter((i) => i.isResolved).length;
  const publicationGate = getPublicationGate(report);

  const handleReaudit = async () => {
    if (!report.currentDraftText.trim()) {
      setReauditError('Add content before running a fresh governance audit.');
      return;
    }
    setIsReauditing(true);
    setReauditError('');
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftText: report.currentDraftText,
          guidelineText: report.guidelineText ?? DEFAULT_GUIDELINES,
          specText: report.specText ?? DEFAULT_SPECS,
          apiKey: settings.apiKey || undefined,
          provider: settings.provider || 'gemini',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.report) {
        throw new Error(data.error || 'The fresh governance audit could not be completed.');
      }
      const freshReport: AuditReport = data.report;
      const remediated: AuditReport = {
        ...freshReport,
        issues: freshReport.issues.map((issue) => ({ ...issue, isResolved: false, appliedFix: undefined })),
        requiresReaudit: false,
      };
      setReport(remediated);
      saveStoredReport(remediated);
      setActiveIssueId(remediated.issues[0]?.id ?? null);
    } catch (error) {
      setReauditError(error instanceof Error ? error.message : 'The fresh governance audit could not be completed.');
    } finally {
      setIsReauditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <a href="#workspace-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:mr-4 focus:top-3 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <Navbar
        currentReport={report}
        onOpenSettings={() => setShowSettingsModal(true)}
        onLoadJudgePreset={() => { updateReportState(TECHCORP_REPORT); setActiveIssueId('issue-1'); }}
      />

      <main id="workspace-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-5">
      {/* Macro Insight Banner */}
      {report.macroInsight?.hasAmbiguity && (
        <div className="w-full bg-violet-50 border-b border-violet-200 py-2.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-md bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <span className="font-semibold text-violet-800">{report.macroInsight.title}</span>
              <span className="text-slate-500 hidden md:inline">
                — {report.macroInsight.description.substring(0, 90)}…
              </span>
            </div>
            <button
              onClick={() => setShowAmbiguityModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors shrink-0"
            >
              <Zap className="w-3 h-3" />
              Generate Rule Proposal
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-5">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              title="Back to Audit Launcher"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-slate-900 truncate max-w-xs min-w-0">{report.draftTitle}</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  {report.issues.length} flags
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm min-w-0">
                vs. {report.brandGuidelineTitle} & {report.productSpecTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unresolvedCount > 0 && (
              <button
                onClick={handleResolveAll}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply All ({unresolvedCount})
              </button>
            )}
            <button
              onClick={handleResetToInitial}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset to initial draft"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {!publicationGate.ready && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {publicationGate.requiresReaudit ? 'Draft changed since the last audit.' : 'Publication gate is locked.'}
              </p>
              <p className="text-xs text-amber-700 mt-1">{publicationGate.reason}</p>
            </div>
            <button
              type="button"
              onClick={handleReaudit}
              disabled={isReauditing}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isReauditing ? 'Re-auditing…' : 'Re-run audit'}
            </button>
          </div>
        )}

        {/* Main 2-column workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT PANEL */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            {/* Left header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">Draft Inspector</span>
                <span className="text-xs text-slate-400 tabular-nums">
                  ({report.currentDraftText.split(/\s+/).filter(Boolean).length} words)
                </span>
              </div>
              {/* View switcher */}
              <div className="flex items-center bg-slate-100 rounded-md p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEditorMode('highlights')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] transition-colors font-medium ${
                    editorMode === 'highlights' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Highlights
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('edit')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] transition-colors font-medium ${
                    editorMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 min-h-[360px] text-sm leading-relaxed">
              {editorMode === 'highlights' ? (
                <div className="space-y-4">
                  <div className="text-slate-800 text-sm leading-loose whitespace-pre-wrap select-text">
                    {renderInteractiveHighlightedText(report.currentDraftText, report.issues, activeIssueId, handleHighlightClick)}
                  </div>

                  {/* Legend */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-400">Legend:</span>
                    {[
                      { label: 'Factual Error', cls: 'bg-red-100 border-red-300 text-red-600' },
                      { label: 'Tone Mismatch', cls: 'bg-amber-100 border-amber-300 text-amber-700' },
                      { label: 'Ambiguity', cls: 'bg-violet-100 border-violet-300 text-violet-600' },
                      { label: 'Fixed', cls: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
                    ].map((l) => (
                      <span key={l.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${l.cls}`}>
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-2">
                  <textarea
                    value={report.currentDraftText}
                    onChange={(e) => updateReportState({ ...report, currentDraftText: e.target.value, requiresReaudit: true })}
                    aria-label="Content draft"
                    className="w-full h-80 bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Edit draft directly…"
                  />
                  <p className="text-[11px] text-slate-400">Direct edits sync with the audit report live. Changed drafts require a fresh audit before export.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${unresolvedCount === 0 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {unresolvedCount === 0 ? 'Fully remediated' : `${unresolvedCount} pending`}
              </span>
              <span className="font-mono">Flesch: 68</span>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-6 space-y-4">
            {/* Score Gauge */}
            <ScoreGauge
              score={report.currentScore}
              breakdown={report.scoreBreakdown}
              totalIssues={report.issues.length}
              resolvedIssues={resolvedCount}
            />

            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
              {[
                { key: 'ALL', label: `All (${report.issues.length})`, dot: '' },
                { key: 'FACTUAL_ERROR', label: `Factual (${report.issues.filter(i => i.type === 'FACTUAL_ERROR').length})`, dot: 'bg-red-500' },
                { key: 'TONE_MISMATCH', label: `Tone (${report.issues.filter(i => i.type === 'TONE_MISMATCH').length})`, dot: 'bg-amber-400' },
                { key: 'GUIDELINE_AMBIGUITY', label: `Ambiguity (${report.issues.filter(i => i.type === 'GUIDELINE_AMBIGUITY' || i.type === 'GUIDELINE_CONFLICT').length})`, dot: 'bg-violet-400' },
                { key: 'RESOLVED', label: `Resolved (${resolvedCount})`, dot: 'bg-emerald-500' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterType(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Issue Cards */}
            <div className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-900">No issues match this filter</h4>
                  <p className="text-xs text-slate-400">All flagged items in this category have been resolved.</p>
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const isActive = activeIssueId === issue.id;
                  const isCitationOpen = !!expandedCitations[issue.id];
                  const activeTone = issue.selectedTone || 'balanced';

                  const issueStyle = issue.isResolved
                    ? { border: 'border-emerald-200 bg-emerald-50/30', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resolved' }
                    : issue.type === 'FACTUAL_ERROR'
                    ? { border: isActive ? 'border-red-300 shadow-md' : 'border-red-200', badge: 'bg-red-50 text-red-700 border-red-200', label: 'Factual Error' }
                    : issue.type === 'TONE_MISMATCH'
                    ? { border: isActive ? 'border-amber-300 shadow-md' : 'border-amber-200', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Tone Mismatch' }
                    : { border: isActive ? 'border-violet-300 shadow-md' : 'border-violet-200', badge: 'bg-violet-50 text-violet-700 border-violet-200', label: 'Guideline Issue' };

                  return (
                    <div
                      key={issue.id}
                      ref={(el) => { cardRefs.current[issue.id] = el; }}
                      className={`bg-white border rounded-xl p-4 transition-all duration-200 ${issueStyle.border} ${isActive && !issue.isResolved ? 'ring-2 ring-indigo-200' : ''}`}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${issueStyle.badge}`}>
                            {issueStyle.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            {issue.severity}
                          </span>
                        </div>
                        {issue.isResolved ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Fixed
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Needs fix
                          </span>
                        )}
                      </div>

                      {/* Flagged text */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Flagged text</div>
                        <p className="text-xs font-medium text-red-600 line-through decoration-red-400/60">
                          &ldquo;{issue.flaggedText}&rdquo;
                        </p>
                      </div>

                      {/* Explanation */}
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{issue.explanation}</p>

                      {/* Citation accordion */}
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => toggleCitation(issue.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 transition-colors"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                            {issue.citation}
                          </span>
                          {isCitationOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {isCitationOpen && (
                          <div className="mt-1.5 px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs animate-fadeIn">
                            <div className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide mb-1">Source quote</div>
                            <blockquote className="text-slate-700 italic border-l-2 border-indigo-300 pl-2.5 leading-relaxed">
                              &ldquo;{issue.groundedSourceQuote}&rdquo;
                            </blockquote>
                          </div>
                        )}
                      </div>

                      {/* Tone Slider */}
                      <div className="mb-3">
                        <ToneSlider
                          selectedTone={activeTone}
                          onSelectTone={(tone) => handleSelectTone(issue.id, tone)}
                          fixes={issue.suggestedFixes}
                          disabled={issue.isResolved}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          {issue.isResolved ? 'Applied to draft' : 'Select tone · apply fix'}
                        </span>
                        {issue.isResolved ? (
                          <button
                            type="button"
                            onClick={() => handleRevertFix(issue)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Revert
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyFix(issue)}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Apply Fix
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      </main>

      {report.macroInsight && (
        <GuidelineAmbiguityModal
          insight={report.macroInsight}
          isOpen={showAmbiguityModal}
          onClose={() => setShowAmbiguityModal(false)}
          onSubmitProposal={(insight) => submitGovernanceProposal(insight)}
        />
      )}
      <ExportModal report={report} isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <SettingsModal
        settings={settings}
        onUpdateSettings={setSettings}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

// Inline highlight renderer
function renderInteractiveHighlightedText(
  text: string,
  issues: AuditIssue[],
  activeIssueId: string | null,
  onHighlightClick: (issueId: string) => void
) {
  if (!text) return null;

  type Span = { start: number; end: number; issue: AuditIssue; isRemediated: boolean; str: string };
  const spans: Span[] = [];

  issues.forEach((issue) => {
    const target = issue.isResolved && issue.appliedFix ? issue.appliedFix : issue.flaggedText;
    if (!target) return;
    let index = text.indexOf(target);
    while (index !== -1) {
      spans.push({ start: index, end: index + target.length, issue, isRemediated: !!issue.isResolved, str: target });
      index = text.indexOf(target, index + target.length);
    }
  });

  if (spans.length === 0) return text;
  spans.sort((a, b) => a.start - b.start);

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  spans.forEach((span, idx) => {
    if (span.start < lastIndex) return;
    if (span.start > lastIndex) {
      elements.push(<span key={`text-${idx}`}>{text.substring(lastIndex, span.start)}</span>);
    }

    const { issue, isRemediated, str } = span;
    const isActive = activeIssueId === issue.id;

    let cls = 'bg-red-100 text-red-800 border-b-2 border-red-400';
    let tag = 'Factual';
    if (isRemediated) {
      cls = 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-500';
      tag = '✓ Fixed';
    } else if (issue.type === 'TONE_MISMATCH') {
      cls = 'bg-amber-100 text-amber-800 border-b-2 border-amber-400';
      tag = 'Tone';
    } else if (issue.type === 'GUIDELINE_AMBIGUITY' || issue.type === 'GUIDELINE_CONFLICT') {
      cls = 'bg-violet-100 text-violet-800 border-b-2 border-violet-400';
      tag = 'Policy';
    }

    elements.push(
      <mark
        key={`mark-${issue.id}-${idx}`}
        onClick={() => onHighlightClick(issue.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            onHighlightClick(issue.id);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View audit issue: ${issue.flaggedText}`}
        className={`px-0.5 py-0 rounded-[3px] cursor-pointer transition-all duration-150 ${cls} ${
          isActive ? 'ring-2 ring-indigo-400 ring-offset-1' : 'hover:opacity-80'
        }`}
        title={`Click to view: ${issue.flaggedText}`}
      >
        {str}
        <span className="ml-1 text-[9px] font-semibold uppercase opacity-70">[{tag}]</span>
      </mark>
    );

    lastIndex = span.end;
  });

  if (lastIndex < text.length) {
    elements.push(<span key="text-end">{text.substring(lastIndex)}</span>);
  }

  return elements;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
