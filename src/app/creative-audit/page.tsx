'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { getStoredSettings } from '@/lib/storage';
import { AuditReport, AuditIssue, ToneStyle } from '@/lib/types';
import {
  ImagePlus,
  FileImage,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  X,
  Palette,
  Sparkles,
  FileText,
  Eye,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const DEFAULT_GUIDELINES = `# Inkloom Brand Guidelines
## Brand identity
- Brand: Inkloom
- Product: AI-assisted brand-governance and content-review platform
- Promise: help teams review content for accuracy, brand consistency, and governance before publication.

## Approved colors
- Primary Navy: #1A237E — headings, primary buttons, logo on light backgrounds
- Accent Teal: #00C896 — positive status and highlights
- Soft Pink: #FADADD — gentle backgrounds only
- Light Gray: #F5F7FA — page and card backgrounds
- White: #FFFFFF — text on dark navy where contrast is sufficient

## Tone of voice
- Clear, professional, helpful, confident, evidence-led.
- Explain limitations honestly.
- Avoid absolute guarantees, exaggerated superlatives, fear-based language, and unsupported competitor comparisons.
- Prefer "helps teams review" over "guarantees perfect compliance."

## Content rules
- Do not claim 100% accuracy or guaranteed compliance.
- Do not claim the product replaces all human review.
- Do not invent customers, certifications, statistics, or years in business.
- Discounts, prices, and event dates must match an approved campaign brief.`;

const DEFAULT_SPECS = `# Inkloom Product Specifications
## Supported capabilities
- Users submit marketing copy for AI-assisted review.
- Review flags unsupported factual claims, tone mismatches, and policy issues.
- The platform suggests edits for human review.
- Brand Trust Score is a workflow indicator, not legal certification.

## Explicit limitations
- No guarantee of 100% accuracy.
- Does not replace all human reviewers.
- No approved source supports "better than all competitors" or "World's #1".
- Prices, discounts, customers, certifications, and dates require a separate approved brief.

## Approved wording
"Inkloom helps marketing teams review content against brand guidance and approved product information."

## Disallowed wording
"Inkloom guarantees 100% accuracy for all content and replaces human reviewers completely."`;

const SAMPLE_CREATIVES = [
  {
    name: '05 Misleading Claim Ad',
    file: '/samples/05_misleading_claim_ad.png',
    badge: 'High Risk',
    desc: 'False 100% accuracy claim & off-brand colors',
  },
  {
    name: '06 Off-Brand Color Post',
    file: '/samples/06_off_brand_color_post.png',
    badge: 'Palette Drift',
    desc: 'Unapproved magenta/pink background',
  },
  {
    name: '01 Compliant Campaign',
    file: '/samples/01_valid_campaign_post.png',
    badge: 'Compliant',
    desc: 'Approved colors, honest claims',
  },
];

export default function CreativeAuditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [guidelines, setGuidelines] = useState(DEFAULT_GUIDELINES);
  const [specs, setSpecs] = useState(DEFAULT_SPECS);
  const [settings, setSettings] = useState(getStoredSettings());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [visualColors, setVisualColors] = useState<string[]>([]);
  const [visualCheck, setVisualCheck] = useState('');
  const [visualBusy, setVisualBusy] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeToneMap, setActiveToneMap] = useState<Record<string, ToneStyle>>({});

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function chooseFile(next: File | undefined) {
    setError('');
    setReport(null);
    setVisualCheck('');
    if (!next) return;
    if (!allowedTypes.includes(next.type)) {
      setError('Please choose a PNG, JPG, WEBP, or GIF image.');
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function loadSample(sample: (typeof SAMPLE_CREATIVES)[0]) {
    setError('');
    setReport(null);
    setVisualCheck('');
    try {
      const res = await fetch(sample.file);
      const blob = await res.blob();
      const sampleFile = new File([blob], sample.file.split('/').pop() || 'sample.png', {
        type: blob.type || 'image/png',
      });
      setFile(sampleFile);
      setPreview(sample.file);
    } catch {
      setError('Could not load the sample image. Please upload a local file.');
    }
  }

  async function fileToBase64(inputFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(inputFile);
    });
  }

  async function runCreativeAudit() {
    setError('');
    setReport(null);
    if (!file) {
      setError('Please upload or select an advertisement or creative image first.');
      return;
    }

    setBusy(true);
    try {
      const imageBase64 = await fileToBase64(file);
      const res = await fetch('/api/audit/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: file.type || 'image/png',
          guidelineText: guidelines,
          specText: specs,
          apiKey: settings.apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Creative audit failed. Please try again.');
      }
      setReport(data.report as AuditReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete creative audit with Gemini.');
    } finally {
      setBusy(false);
    }
  }

  async function runVisualPaletteCheck() {
    if (!preview) {
      setVisualCheck('Choose or upload an image first.');
      return;
    }
    setVisualBusy(true);
    setVisualCheck('');
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 120 / Math.max(img.naturalWidth, img.naturalHeight));
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error('Image context unavailable.');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const bins: Record<string, number> = {};
          for (let i = 0; i < pixels.length; i += 16) {
            if (pixels[i + 3] < 180) continue;
            const r = Math.round(pixels[i] / 32) * 32;
            const g = Math.round(pixels[i + 1] / 32) * 32;
            const b = Math.round(pixels[i + 2] / 32) * 32;
            const hex = `#${[r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
            bins[hex] = (bins[hex] || 0) + 1;
          }
          const colors = Object.entries(bins)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map((entry) => entry[0]);
          setVisualColors(colors);
          const approved = [...guidelines.matchAll(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi)].map((m) => m[0].toUpperCase());
          const excluded = /(#FADADD|#FFD1DC|#FFB6C1|#F5F7FA|#FFFFFF|WHITE|LIGHT|BACKGROUND|GRAY|GREY)/i;
          const primaryApproved = approved.filter((color) => !excluded.test(color));
          const offBrand = colors.filter((color) => !primaryApproved.some((approvedColor) => distance(color, approvedColor) < 90 * 90 * 3));
          setVisualCheck(
            colors.length
              ? offBrand.length
                ? `Visual palette sampler: dominant color(s) outside primary palette: ${offBrand.join(', ')}. Review before publication.`
                : 'Visual palette sampler: sampled colors align with approved primary palette.'
              : 'Visual palette sampler: insufficient colored pixels sampled.',
          );
        } catch (e) {
          setVisualCheck(e instanceof Error ? e.message : 'The visual palette check could not run for this image.');
        } finally {
          setVisualBusy(false);
        }
      };
      img.onerror = () => {
        setVisualCheck('Could not load this image for client-side palette sampling.');
        setVisualBusy(false);
      };
      img.src = preview;
    } catch {
      setVisualBusy(false);
    }
  }

  function handleCopyExtracted(text: string) {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />
      <a
        href="#creative-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:mr-4 focus:top-3 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to creative audit content
      </a>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="creative-content">
        {/* Header */}
        <div className="mb-7 max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700">
            <FileImage className="h-4 w-4" /> MULTIMODAL VISION · CREATIVE AUDIT
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Audit an advertisement or digital creative
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Upload any marketing graphic, social banner, or poster. Gemini inspects the image visually,
            transcribes all copy, and checks claims, tone, and brand colors against your Brand References.
          </p>
        </div>

        {/* Input Grid: Image Upload & Brand References */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section 1: Upload Creative */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <ImagePlus className="h-5 w-5 text-indigo-600" /> 1. Upload creative
                </h2>
                {file && (
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                    Image Selected
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-indigo-500 hover:bg-indigo-50/40">
                <ImagePlus className="mb-2 h-8 w-8 text-slate-400" />
                <span className="font-semibold text-slate-800">Click to upload or drag & drop</span>
                <span className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP or GIF · up to 10 MB</span>
                <input
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => chooseFile(e.target.files?.[0])}
                />
              </label>

              {/* Sample Quick Selectors */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">⚡ Or try a test sample:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_CREATIVES.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => void loadSample(s)}
                      className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition text-xs"
                    >
                      <div className="font-semibold text-slate-800 truncate">{s.name}</div>
                      <div className="text-[10px] text-indigo-600 font-medium mt-0.5">{s.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Preview Box */}
              {preview && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 text-xs border-b border-slate-200">
                    <span className="truncate font-medium text-slate-700">{file?.name || 'Uploaded Creative'}</span>
                    <button
                      className="ml-3 rounded p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                      onClick={() => {
                        setFile(null);
                        setPreview('');
                        setReport(null);
                        setVisualCheck('');
                      }}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex max-h-[380px] items-center justify-center p-3">
                    <Image
                      src={preview}
                      alt="Uploaded marketing creative preview"
                      width={800}
                      height={600}
                      unoptimized
                      className="max-h-[350px] max-w-full object-contain rounded-md shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Visual Palette Quick Sampler */}
            {preview && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => void runVisualPaletteCheck()}
                  disabled={visualBusy}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition w-full"
                >
                  <Palette className="h-3.5 w-3.5 text-indigo-600" />
                  {visualBusy ? 'Sampling pixels…' : 'Sample dominant image colors'}
                </button>
                {visualColors.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 justify-center">
                    {visualColors.map((color) => (
                      <span
                        key={color}
                        className="inline-block w-5 h-5 rounded-md border border-slate-300 shadow-xs"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
                {visualCheck && (
                  <p className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
                    {visualCheck}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Section 2: Brand References */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" /> 2. Brand references
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setGuidelines(DEFAULT_GUIDELINES);
                    setSpecs(DEFAULT_SPECS);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <RefreshCw className="h-3 w-3" /> Reset Brand Pack
                </button>
              </div>

              {/* Guidelines Input */}
              <label className="block text-xs font-semibold text-slate-700">Approved brand guidelines</label>
              <textarea
                className="mt-1.5 min-h-32 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                placeholder="Paste approved tone, voice, color palette, logo rules, disallowed claims…"
                aria-label="Approved brand guidelines"
              />

              {/* Specifications Input */}
              <label className="mt-4 block text-xs font-semibold text-slate-700">
                Product specifications & approved claims
              </label>
              <textarea
                className="mt-1.5 min-h-32 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="Paste verified capabilities, limitations, allowed claims, and prohibited wording…"
                aria-label="Product specifications"
              />
            </div>

            {/* Run Audit Action */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => void runCreativeAudit()}
                disabled={busy || !file}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                    <span>Gemini is analyzing creative & brand references…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>Run Multimodal Creative Audit</span>
                  </>
                )}
              </button>

              {error && (
                <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Audit Results Presentation */}
        {report && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Top Summary Banner */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> GEMINI VISION AUDIT COMPLETED
                </div>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">{report.draftTitle}</h2>
                <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">{report.auditSummary}</p>
              </div>

              {/* Trust Score Gauge Card */}
              <div className="rounded-2xl bg-slate-900 px-6 py-4 text-center text-white shrink-0 shadow-sm">
                <div className="text-4xl font-black tracking-tight">{report.currentScore}%</div>
                <div className="mt-0.5 text-xs font-medium text-slate-300">Brand Trust Score</div>
              </div>
            </div>

            {/* Tri-Metric Score Breakdown */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Factual accuracy', value: report.scoreBreakdown.factualAccuracy, desc: 'Claims, limits & specs' },
                { label: 'Tone alignment', value: report.scoreBreakdown.toneAlignment, desc: 'Voice, superlatives & slang' },
                { label: 'Guideline compliance', value: report.scoreBreakdown.guidelineCompliance, desc: 'Colors, logo & policy' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">{metric.label}</span>
                    <span className={`text-lg font-bold ${metric.value >= 80 ? 'text-emerald-700' : metric.value >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                      {metric.value}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${metric.value >= 80 ? 'bg-emerald-500' : metric.value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">{metric.desc}</p>
                </div>
              ))}
            </div>

            {/* Gemini Vision Observations & Extracted Copy */}
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {/* Extracted Text */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <FileText className="h-4 w-4 text-indigo-600" /> Extracted Marketing Copy
                  </h3>
                  {report.extractedText && (
                    <button
                      type="button"
                      onClick={() => handleCopyExtracted(report.extractedText || '')}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {copiedText ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {copiedText ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-wrap rounded-lg bg-white p-3 text-xs font-mono text-slate-800 border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                  {report.extractedText || 'No marketing text was detected in the creative.'}
                </div>
              </div>

              {/* Visual Observations */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Eye className="h-4 w-4 text-indigo-600" /> Visual & Color Analysis
                  </h3>
                </div>
                <div className="rounded-lg bg-white p-3 text-xs text-slate-700 border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                  {report.visualObservations || 'No specific visual discrepancies noted.'}
                </div>
              </div>
            </div>

            {/* Flagged Issues List */}
            <div className="mt-8">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                Flagged Issues ({report.issues.length})
              </h3>

              {report.issues.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-900">All Brand Governance Checks Passed!</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Gemini found no factual exaggerations, forbidden superlatives, or off-brand colors in this creative.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.issues.map((issue) => {
                    const currentTone = activeToneMap[issue.id] || 'balanced';
                    const activeFix = issue.suggestedFixes[currentTone] || issue.suggestedFixes.balanced;

                    return (
                      <article
                        key={issue.id}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
                      >
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                                issue.severity === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : issue.severity === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {issue.severity}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                              {issue.type.replaceAll('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-500">{issue.citation}</span>
                        </div>

                        {/* Flagged element & explanation */}
                        <div className="mt-3">
                          <div className="font-semibold text-sm text-slate-900 bg-red-50/70 border-l-4 border-red-500 px-3 py-2 rounded-r-md">
                            &ldquo;{issue.flaggedText}&rdquo;
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">{issue.explanation}</p>
                          {issue.groundedSourceQuote && (
                            <p className="mt-1.5 text-[11px] text-slate-500 italic bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                              Grounded rule: &ldquo;{issue.groundedSourceQuote}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Tone Selector & Suggested Fix */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Suggested Remediation
                            </span>
                            <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                              {(['hook', 'balanced', 'strict'] as ToneStyle[]).map((tone) => (
                                <button
                                  key={tone}
                                  type="button"
                                  onClick={() => setActiveToneMap((prev) => ({ ...prev, [issue.id]: tone }))}
                                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                                    currentTone === tone
                                      ? 'bg-white text-indigo-700 shadow-xs'
                                      : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  {tone === 'hook' ? '🔥 Hook' : tone === 'balanced' ? '⚖️ Balanced' : '🏛️ Strict'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-950 font-medium">
                            {activeFix}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function distance(a: string, b: string): number {
  const toHex = (value: string) => value.replace('#', '');
  const parse = (value: string) => [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
  const x = parse(toHex(a));
  const y = parse(toHex(b));
  return x.reduce((sum, channel, index) => sum + Math.pow(channel - y[index], 2), 0);
}
