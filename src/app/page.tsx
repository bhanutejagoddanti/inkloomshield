'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SettingsModal } from '@/components/SettingsModal';
import { DEFAULT_DRAFT, DEFAULT_SPECS, DEFAULT_GUIDELINES, PRESET_SCENARIOS } from '@/lib/demoData';
import { getStoredSettings, saveStoredReport, UserSettings } from '@/lib/storage';
import { AuditReport, PresetScenario } from '@/lib/types';
import { Shield, FileText, Upload, ArrowRight, CheckCircle, Cpu, FileCheck, Zap, Sliders, Sparkles, AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [draftText, setDraftText] = useState(DEFAULT_DRAFT);
  const [guidelinesText, setGuidelinesText] = useState(DEFAULT_GUIDELINES);
  const [specsText, setSpecsText] = useState(DEFAULT_SPECS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('techcorp-smartwatch');
  const [guidelineDocName, setGuidelineDocName] = useState('TechCorp_Brand_Voice_Guide_2026.pdf');
  const [specDocName, setSpecDocName] = useState('TechCorp_Hardware_Specs_v4.1.pdf');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());
  const [auditError, setAuditError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  const handleSelectScenario = (scenario: PresetScenario) => {
    setActiveScenarioId(scenario.id);
    setDraftText(scenario.draftText);
    setGuidelinesText(scenario.guidelinesText);
    setSpecsText(scenario.specsText);
    setGuidelineDocName(scenario.guidelineDocName);
    setSpecDocName(scenario.specDocName);
  };

  const handleLoadJudgePresetAndRun = async () => {
    const techcorp = PRESET_SCENARIOS[0];
    handleSelectScenario(techcorp);
    await triggerAudit(techcorp.draftText, techcorp.guidelinesText, techcorp.specsText);
  };

  const handleRunAudit = async () => {
    if (!draftText.trim()) return;
    setAuditError('');
    await triggerAudit(draftText, guidelinesText, specsText);
  };

  const triggerAudit = async (draft: string, guidelines: string, specs: string) => {
    setIsAuditing(true);
    setAuditStep(1);
    setAuditError('');
    setTimeout(() => setAuditStep(2), 600);
    setTimeout(() => setAuditStep(3), 1200);
    setTimeout(() => setAuditStep(4), 1800);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftText: draft,
          guidelineText: guidelines,
          specText: specs,
          apiKey: settings.apiKey || undefined,
          provider: settings.provider || 'gemini',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.report) {
        throw new Error(data.error || 'The governance audit could not be completed.');
      }
      const finalReport: AuditReport = data.report;
      saveStoredReport(finalReport);
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/workspace');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The governance audit could not be completed.';
      setAuditError(message);
    } finally {
      setIsAuditing(false);
      setAuditStep(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'guidelines' | 'specs') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'guidelines') setGuidelineDocName(file.name);
    else setSpecDocName(file.name);
    setUploadError('');

    try {
      let content = '';
      if (file.type === 'application/pdf') {
        setIsUploading(true);
        setUploadError('');
        const formData = new FormData();
        formData.append('file', file);
        const extractRes = await fetch('/api/extract', { method: 'POST', body: formData });
        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData.success) {
          throw new Error(extractData.error || 'The PDF could not be parsed.');
        }
        content = extractData.text;
      } else {
        const reader = new FileReader();
        const fileContent = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => resolve((event.target?.result as string) || '');
          reader.onerror = () => reject(new Error('The file could not be read.'));
          reader.readAsText(file);
        });
        content = fileContent;
      }

      if (type === 'guidelines') setGuidelinesText(content);
      else setSpecsText(content);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The file could not be loaded.');
    } finally {
      setIsUploading(false);
    }
  };

  const auditSteps = [
    { title: 'Vectorizing Documents', desc: 'Chunking guidelines & specs' },
    { title: 'Fact Cross-Verification', desc: 'Checking claims against ground truth' },
    { title: 'Tone Modeling', desc: 'Evaluating brand voice alignment' },
    { title: 'Synthesizing Citations', desc: 'Building remediation matrix' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar onOpenSettings={() => setShowSettings(true)} onLoadJudgePreset={handleLoadJudgePresetAndRun} />

      <a href="#audit-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:mr-4 focus:top-3 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to audit content
      </a>

      <main id="audit-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700" role="alert">
            <p className="font-semibold">Upload failed</p>
            <p className="text-xs mt-1">{uploadError}</p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Pre-publication Brand Governance
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Stop Brand Violations
            <br />
            <span className="text-indigo-600">Before They Ship</span>
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Inkloom Shield cross-references marketing drafts against your brand guidelines and product specs — surfacing factual errors, tone drift, and policy violations with grounded citations.
          </p>

          {/* Demo CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              onClick={handleLoadJudgePresetAndRun}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Load Demo Preset
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-400">
              Pre-loaded with 3 intentional violations · no API key needed
            </p>
          </div>
        </div>

        {/* Preset Tabs */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Choose a scenario</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_SCENARIOS.map((scenario) => {
              const isSelected = activeScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-white border-indigo-300 shadow-md ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-900 truncate">{scenario.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {scenario.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug line-clamp-2">{scenario.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Input Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Panel 1 */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-red-50 border border-red-200 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">1. Content Draft</h3>
                  <span className="text-[10px] text-slate-400">Unverified marketing copy</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {draftText.split(/\s+/).filter(Boolean).length}w
              </span>
            </div>
            <div className="flex-1 p-3">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Paste draft copy to inspect…"
                aria-label="Content draft copy"
                className="w-full h-52 bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 text-[11px] text-slate-400">
              <span>Blogs, ads, press releases</span>
              <button onClick={() => setDraftText('')} className="hover:text-slate-700 font-medium transition-colors">Clear</button>
            </div>
          </div>

          {/* Panel 2 */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">2. Brand Guidelines</h3>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">{guidelineDocName}</span>
                </div>
              </div>
              <label className="cursor-pointer flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 border border-violet-200 px-2 py-1 rounded-md transition-colors">
                <Upload className="w-3 h-3" />
                Upload
                <input type="file" accept=".pdf,.txt,.md" aria-label="Upload brand guidelines" className="hidden" onChange={(e) => handleFileUpload(e, 'guidelines')} />
              </label>
            </div>
            <div className="flex-1 p-3">
              <textarea
                value={guidelinesText}
                onChange={(e) => setGuidelinesText(e.target.value)}
                placeholder="Paste approved brand guidelines…"
                aria-label="Approved brand guidelines"
                className="w-full h-52 bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-400">Voice, tone, policy rules</span>
              <span className="text-violet-600 font-medium">Verified Source</span>
            </div>
          </div>

          {/* Panel 3 */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">3. Product Specs</h3>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">{specDocName}</span>
                </div>
              </div>
              <label className="cursor-pointer flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md transition-colors">
                <Upload className="w-3 h-3" />
                Upload
                <input type="file" accept=".pdf,.txt,.md" aria-label="Upload product specifications" className="hidden" onChange={(e) => handleFileUpload(e, 'specs')} />
              </label>
            </div>
            <div className="flex-1 p-3">
              <textarea
                value={specsText}
                onChange={(e) => setSpecsText(e.target.value)}
                placeholder="Paste technical specifications…"
                aria-label="Product technical specifications"
                className="w-full h-52 bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-400">Battery, pricing, IP ratings</span>
              <span className="text-emerald-600 font-medium">Ground Truth</span>
            </div>
          </div>
        </div>

        {/* Audit Launch Bar */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Dual-Engine Governance Audit</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Factual cross-verification · Intent-preserving tone slider · Guideline ambiguity detector
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 bg-white text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              title="Configure API key / providers"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={handleRunAudit}
              disabled={isAuditing || !draftText.trim()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Run Audit
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {auditError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Audit failed</p>
              <p className="text-xs text-red-700 mt-1">{auditError}</p>
              <p className="text-xs text-red-600 mt-1">No fallback audit result was loaded.</p>
            </div>
          </div>
        )}

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
          {[
            {
              icon: '📌',
              title: 'Grounded Citations',
              desc: 'Every violation is tied to a page and section number from your uploaded spec or guideline doc.',
              color: 'text-red-600',
            },
            {
              icon: '🎚️',
              title: 'Tone Slider',
              desc: 'Choose between Persuasive, Balanced, or Corporate rewrite styles before applying any fix.',
              color: 'text-amber-600',
            },
            {
              icon: '💡',
              title: 'Guideline Flaw Detector',
              desc: 'Identifies vague rules causing repeat errors and proposes RFC amendments for brand managers.',
              color: 'text-violet-600',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
              <div className="text-xl">{f.icon}</div>
              <h4 className="text-sm font-semibold text-slate-900">{f.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Audit Progress Modal */}
      {isAuditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-xl space-y-5 animate-slideIn">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Running Governance Audit</h3>
                <p className="text-xs text-slate-400">Inkloom Shield · Dual-Engine</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {auditSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isDone = auditStep > stepNum;
                const isCurrent = auditStep === stepNum;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs transition-all ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-200'
                        : isCurrent
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-slate-50 border-slate-200 opacity-50'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center text-[9px] font-mono text-slate-400">
                          {stepNum}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${isDone ? 'text-emerald-800' : isCurrent ? 'text-indigo-800' : 'text-slate-600'}`}>
                        {step.title}
                      </p>
                      <p className="text-slate-400 text-[11px]">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-slate-400">Redirecting to workspace…</p>
          </div>
        </div>
      )}

      <SettingsModal
        settings={settings}
        onUpdateSettings={setSettings}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
