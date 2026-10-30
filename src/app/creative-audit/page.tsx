'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { getStoredSettings } from '@/lib/storage';
import { AuditReport } from '@/lib/types';
import { ImagePlus, FileImage, ScanText, ShieldCheck, AlertTriangle, Loader2, X, Palette } from 'lucide-react';

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default function CreativeAuditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [copy, setCopy] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [specs, setSpecs] = useState('');
  const [settings, setSettings] = useState(getStoredSettings());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [visualColors, setVisualColors] = useState<string[]>([]);
  const [visualCheck, setVisualCheck] = useState('');
  const [visualBusy, setVisualBusy] = useState(false);

  useEffect(() => { setSettings(getStoredSettings()); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseFile(next: File | undefined) {
    setError(''); setReport(null); setVisualCheck('');
    if (!next) return;
    if (!allowedTypes.includes(next.type)) { setError('Please choose a PNG, JPG, WEBP, or GIF image.'); return; }
    if (next.size > 10 * 1024 * 1024) { setError('Image must be 10 MB or smaller.'); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next); setPreview(URL.createObjectURL(next));
  }

  async function runAudit() {
    setError(''); setReport(null);
    if (!file) { setError('Upload an advertisement, poster, or social media creative first.'); return; }
    if (!copy.trim()) { setError('Add the text from the creative in the copy field. This version does not perform automatic OCR on the image.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draftText: copy, guidelineText: guidelines, specText: specs, apiKey: settings.apiKey, provider: settings.provider }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Audit failed. Please try again.');
      setReport(data.report as AuditReport);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to run the audit.'); }
    finally { setBusy(false); }
  }

  async function runVisualPaletteCheck() {
    if (!preview) { setVisualCheck('Choose an image first.'); return; }
    setVisualBusy(true);
    setVisualCheck('');
    try {
      const img = new window.Image();
      img.onload = async () => {
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
          const colors = Object.entries(bins).sort((a, b) => b[1] - a[1]).slice(0, 6).map((entry) => entry[0]);
          setVisualColors(colors);
          const approved = [...guidelines.matchAll(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi)].map((m) => m[0].toUpperCase());
          const excluded = /(#FADADD|#FFD1DC|#FFB6C1|#F5F7FA|#FFFFFF|#FFFFFF|WHITE|LIGHT|BACKGROUND|GRAY|GREY)/i;
          const primaryApproved = approved.filter((color) => !excluded.test(color));
          const offBrand = colors.filter((color) => !primaryApproved.some((approvedColor) => distance(color, approvedColor) < 90 * 90 * 3));
          setVisualCheck(
            colors.length
              ? offBrand.length
                ? `Visual palette check: dominant color${offBrand.length === 1 ? '' : 's'} outside the approved primary palette: ${offBrand.join(', ')}. Review before publication.`
                : 'Visual palette check: sampled colors are within a reasonable tolerance of approved primary colors. Manual brand review is still recommended.'
              : 'Visual palette check: not enough visible content was sampled to assess the palette.',
          );
        } catch (e) {
          setVisualCheck(e instanceof Error ? e.message : 'The visual palette check could not run for this image.');
        }
      };
      img.onerror = () => setVisualCheck('Could not load this image for palette sampling.');
      img.src = preview;
    } finally { setVisualBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#creative-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:mr-4 focus:top-3 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to creative audit content
      </a>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="creative-content">
        <div className="mb-7 max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-700"><FileImage className="h-4 w-4" /> ROUND 3 · CREATIVE AUDIT</div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Audit an advertisement or digital post</h1>
          <p className="mt-3 leading-7 text-slate-600">Upload a banner, poster, flyer, or social-media creative. Review the image alongside its marketing copy and check the copy against your approved brand guidelines and product specifications.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><ImagePlus className="h-5 w-5 text-indigo-600" /> 1. Upload creative</h2>
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
              <ImagePlus className="mb-2 h-8 w-8 text-slate-400" />
              <span className="font-semibold">Choose an image to upload</span>
              <span className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP or GIF · max 10 MB</span>
              <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => chooseFile(e.target.files?.[0])} />
            </label>
            {preview && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between bg-slate-50 px-3 py-2 text-xs">
                  <span className="truncate font-medium">{file?.name}</span>
                  <button className="ml-3 rounded p-1 hover:bg-slate-200" onClick={() => { setFile(null); setPreview(''); setReport(null); setVisualCheck(''); }} aria-label="Remove image">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex max-h-[420px] items-center justify-center bg-slate-100 p-3">
                  <Image src={preview} alt="Uploaded marketing creative preview" width={800} height={600} unoptimized className="max-h-[390px] max-w-full object-contain" />
                </div>
              </div>
            )}
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <strong>OCR limitation:</strong> Image preview and upload are supported, but text is not automatically extracted from the image yet. Paste or type the text shown in your creative below so it can be audited.
            </div>
            <label className="mt-5 block text-sm font-semibold">2. Marketing copy shown in the image</label>
            <textarea className="mt-2 min-h-36 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="Paste the headline, offer, product claims, CTA, disclaimers, and other text from the poster or social post…" aria-label="Creative marketing copy" />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-indigo-600" /> 3. Brand references</h2>
            <label className="block text-sm font-semibold">Approved brand guidelines</label>
            <textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={guidelines} onChange={(e) => setGuidelines(e.target.value)} placeholder="Paste approved tone, wording, visual rules, required disclaimers, logo/color guidance…" aria-label="Approved brand guidelines for creative review" />
            <label className="mt-4 block text-sm font-semibold">Product specifications / approved claims</label>
            <textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="Paste verified product details, prices, features, limits, and approved claims…" aria-label="Product specifications and approved claims for creative review" />
            <button onClick={() => void runAudit()} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Auditing copy…</> : <><ScanText className="h-4 w-4" /> Run creative copy audit</>}
            </button>
            <button onClick={() => void runVisualPaletteCheck()} disabled={visualBusy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60">
              <Palette className="h-4 w-4" /> {visualBusy ? 'Sampling…' : 'Run visual palette check'}
            </button>
            {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            {visualCheck && <p className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">{visualCheck}</p>}
          </section>
        </div>
        {report && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-indigo-700">AUDIT RESULTS</p>
                <h2 className="mt-1 text-xl font-bold">Creative copy review</h2>
                <p className="mt-1 text-sm text-slate-500">{report.auditSummary}</p>
              </div>
              <div className="rounded-xl bg-slate-900 px-5 py-3 text-center text-white">
                <div className="text-3xl font-extrabold">{report.currentScore}%</div>
                <div className="text-xs text-slate-300">Brand Trust Score</div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Factual accuracy', value: report.scoreBreakdown.factualAccuracy },
                { label: 'Tone alignment', value: report.scoreBreakdown.toneAlignment },
                { label: 'Guideline compliance', value: report.scoreBreakdown.guidelineCompliance },
              ].map((x) => (
                <div key={x.label} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{x.label}</p>
                  <p className="mt-1 text-2xl font-bold">{x.value}%</p>
                </div>
              ))}
            </div>
            <h3 className="mb-3 mt-6 font-bold">Flagged issues ({report.issues.length})</h3>
            {report.issues.length === 0 ? (
              <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">No issues were returned by the copy auditor. Human review is still recommended before publishing.</p>
            ) : (
              <div className="space-y-3">
                {report.issues.map((issue, i) => (
                  <article key={issue.id || i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">{issue.severity} · {issue.type.replaceAll('_', ' ')}</span>
                      <span className="text-xs text-slate-400">{issue.citation}</span>
                    </div>
                    <p className="mt-2 font-semibold">{issue.flaggedText}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{issue.explanation}</p>
                    {issue.suggestedFixes?.balanced && <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Suggested fix:</strong> {issue.suggestedFixes.balanced}</p>}
                  </article>
                ))}
              </div>
            )}
            <p className="mt-5 text-xs leading-5 text-slate-400">This audit evaluates the copy supplied above. It does not yet use computer vision to automatically verify the uploaded image&apos;s logo or layout. Treat findings as decision support, not legal certification.</p>
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
