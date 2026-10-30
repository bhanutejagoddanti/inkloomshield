"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Activity, Archive, ArrowRight, BadgeCheck, BookOpen, Check, CheckCircle2,
  ChevronRight, ClipboardCheck, CloudUpload, FileText, GitBranch, Image as ImageIcon,
  LockKeyhole, Palette, Plus, ShieldCheck, Sparkles, Trash2, Upload, Webhook,
  XCircle, AlertTriangle, Download, Eye, RefreshCw
} from "lucide-react";
import Image from "next/image";

type Tab = "overview" | "knowledge" | "visual" | "approvals" | "integrations";
type Guideline = { id: string; name: string; kind: string; content: string; version: number; status: "Approved" | "Draft"; updated: string };
type Approval = { id: string; title: string; owner: string; status: "In review" | "Approved" | "Rejected"; score: number; created: string; notes: string };
type AuditRecord = { id: string; title: string; score: number; issues: number; created: string; status: string };
type BrandAsset = { id: string; name: string; type: string; colors: string; updated: string };

const KEY = "inkloom_round3_hub_v1";
const starterGuidelines: Guideline[] = [
  { id: "g1", name: "Master Brand Voice", kind: "Brand guidelines", content: "Use clear, confident language. Avoid unsupported superlatives. Do not promise guaranteed outcomes. Prefer active voice and plain English.", version: 1, status: "Approved", updated: "2026-10-30" },
  { id: "g2", name: "Product Claims & Specifications", kind: "Product specification", content: "All performance claims must be traceable to approved evidence. Do not invent specifications, certifications, customer results, or availability.", version: 1, status: "Approved", updated: "2026-10-30" },
];
const starterApprovals: Approval[] = [
  { id: "a1", title: "Q4 product launch announcement", owner: "Marketing", status: "In review", score: 82, created: "Today", notes: "Review performance claims and brand color usage." },
  { id: "a2", title: "Customer onboarding email", owner: "Customer success", status: "Approved", score: 100, created: "Yesterday", notes: "All required checks passed." },
];
const starterAssets: BrandAsset[] = [
  { id: "b1", name: "Primary brand palette", type: "Color system", colors: "#4338CA, #0F172A, #FFFFFF", updated: "2026-10-30" },
  { id: "b2", name: "Official logo reference", type: "Logo reference", colors: "Reference file not uploaded", updated: "2026-10-30" },
];
function load<T,>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function contrastRatio(a: string, b: string): number | null {
  const lum = (hex: string) => {
    if (!/^#?([0-9a-f]{6})$/i.test(hex)) return null;
    const h = hex.replace("#", "");
    const c = [0,2,4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
  };
  const l1 = lum(a), l2 = lum(b);
  if (l1 === null || l2 === null) return null;
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
function download(name: string, body: unknown, type = "application/json") {
  const blob = new Blob([typeof body === "string" ? body : JSON.stringify(body, null, 2)], { type });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
const cx = "rounded-xl border border-slate-200 bg-white shadow-sm";
const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
const primary = `${btn} bg-slate-900 text-white hover:bg-slate-800`;
const secondary = `${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export default function GovernancePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [guidelines, setGuidelines] = useState<Guideline[]>(starterGuidelines);
  const [approvals, setApprovals] = useState<Approval[]>(starterApprovals);
  const [assets, setAssets] = useState<BrandAsset[]>(starterAssets);
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState("Brand guidelines");
  const [newContent, setNewContent] = useState("");
  const [editingGuidelineId, setEditingGuidelineId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("Logo");
  const [assetColors, setAssetColors] = useState("#4338CA");
  const [fg, setFg] = useState("#FFFFFF");
  const [bg, setBg] = useState("#4338CA");
  const [visualFile, setVisualFile] = useState<File | null>(null);
  const [visualPreview, setVisualPreview] = useState("");
  const [sampledColors, setSampledColors] = useState<string[]>([]);
  const [paletteReport, setPaletteReport] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookMessage, setWebhookMessage] = useState("");
  const [approvalTitle, setApprovalTitle] = useState("");
  const [approvalOwner, setApprovalOwner] = useState("Marketing");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "guideline" | "asset" | "approval"; id: string } | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setGuidelines(load(KEY + "_guidelines", starterGuidelines));
    setApprovals(load(KEY + "_approvals", starterApprovals));
    setAssets(load(KEY + "_assets", starterAssets));
    setHistory(load(KEY + "_history", [] as AuditRecord[]));
    setWebhookUrl(load(KEY + "_webhook", ""));
    setWebhookSecret(load(KEY + "_secret", ""));
  }, []);
  useEffect(() => { localStorage.setItem(KEY + "_guidelines", JSON.stringify(guidelines)); }, [guidelines]);
  useEffect(() => { localStorage.setItem(KEY + "_approvals", JSON.stringify(approvals)); }, [approvals]);
  useEffect(() => { localStorage.setItem(KEY + "_assets", JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem(KEY + "_history", JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(KEY + "_webhook", webhookUrl); }, [webhookUrl]);
  useEffect(() => { localStorage.setItem(KEY + "_secret", webhookSecret); }, [webhookSecret]);

  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg]);
  const wcagAA = ratio !== null && ratio >= 4.5;
  const unresolved = approvals.filter(a => a.status === "In review").length;
  const avgScore = approvals.length ? Math.round(approvals.reduce((n, a) => n + a.score, 0) / approvals.length) : 100;
  const issueCount = guidelines.reduce((n, g) => n + (/(guaranteed|always|never|best|fastest|leading)/i.test(g.content) ? 1 : 0), 0);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 3200); }
  function addGuideline() {
    if (!newName.trim() || !newContent.trim()) { notify("Add a document name and its contents first."); return; }
    if (editingGuidelineId) {
      setGuidelines(prev => prev.map(g => g.id === editingGuidelineId ? { ...g, name: newName.trim(), kind: newKind, content: newContent.trim(), version: g.version + 1, status: "Draft" as const, updated: new Date().toISOString().slice(0,10) } : g));
      notify("Guideline version updated.");
    } else {
      setGuidelines(prev => [{ id: crypto.randomUUID(), name: newName.trim(), kind: newKind, content: newContent.trim(), version: 1, status: "Draft" as const, updated: new Date().toISOString().slice(0,10) }, ...prev]);
    }
    setEditingGuidelineId(null); setNewName(""); setNewContent(""); notify("Guideline saved to your local knowledge base.");
  }
  function startGuidelineEdit(g: Guideline) {
    setEditingGuidelineId(g.id); setNewName(g.name); setNewKind(g.kind); setNewContent(g.content); setTab("knowledge");
    notify(`Loaded ${g.name} into the version editor. Save to create Version ${g.version + 1}.`);
  }
  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "guideline") setGuidelines(prev => prev.filter(g => g.id !== deleteTarget.id));
    if (deleteTarget.kind === "asset") setAssets(prev => prev.filter(a => a.id !== deleteTarget.id));
    if (deleteTarget.kind === "approval") setApprovals(prev => prev.filter(a => a.id !== deleteTarget.id));
    setDeleteTarget(null);
    notify(`${deleteTarget.kind === "guideline" ? "Guideline" : deleteTarget.kind === "asset" ? "Brand asset" : "Approval item"} deleted.`);
  }
  async function readGuidelineFile(file?: File) {
    if (!file) return;
    const text = await file.text();
    setNewName(file.name.replace(/\.[^.]+$/, "")); setNewContent(text);
    if (/spec|product|claim/i.test(file.name)) setNewKind("Product specification");
    notify("File text loaded. Review it, then save the guideline.");
  }
  function inspectPalette() {
    if (!visualPreview) { notify("Choose an image first."); return; }
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 100 / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) { notify("Could not inspect this image."); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const bins: Record<string, number> = {};
        for (let i = 0; i < pixels.length; i += 16) {
          if (pixels[i + 3] < 180) continue;
          const r = Math.round(pixels[i] / 32) * 32;
          const g = Math.round(pixels[i + 1] / 32) * 32;
          const b = Math.round(pixels[i + 2] / 32) * 32;
          const hex = "#" + [r,g,b].map(v => Math.min(255,v).toString(16).padStart(2,"0")).join("").toUpperCase();
          bins[hex] = (bins[hex] || 0) + 1;
        }
        const top = Object.entries(bins).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
        setSampledColors(top);
        const approved = assets.flatMap(a => (a.colors.match(/#[0-9a-f]{6}/ig) || []).map(c=>c.toUpperCase()));
        const isNeutral = (hex: string) => {
          const rgb = [0,2,4].map(i => parseInt(hex.replace("#","").slice(i,i+2),16));
          const max = Math.max(...rgb);
          const min = Math.min(...rgb);
          return max - min < 24;
        };
        const approvedPrimaries = approved.filter(c => !isNeutral(c));
        const distance = (a: string, b: string) => {
          const rgbA = [0,2,4].map(i => parseInt(a.replace("#","").slice(i,i+2),16));
          const rgbB = [0,2,4].map(i => parseInt(b.replace("#","").slice(i,i+2),16));
          return rgbA.reduce((sum, channel, index) => sum + Math.pow(channel - rgbB[index], 2), 0);
        };
        const match = top.some(c => approvedPrimaries.some(a => distance(c,a) < 65*65*3));
        setPaletteReport(approved.length ? (match ? "At least one sampled image color is near a registered brand color. Review the full palette manually." : "No close match found between the sampled colors and registered palette. Review for possible brand-color drift.") : "No registered hex colors found in the asset register. Add approved colors to compare.");
      } catch {
        setPaletteReport("This image could not be sampled. Try a standard PNG or JPEG.");
      }
    };
    img.onerror = () => setPaletteReport("Could not load this image for color sampling.");
    img.src = visualPreview;
  }

  function addAsset() {
    if (!assetName.trim()) { notify("Enter an asset name."); return; }
    setAssets(prev => [{ id: crypto.randomUUID(), name: assetName.trim(), type: assetType, colors: assetColors.trim() || "Not specified", updated: new Date().toISOString().slice(0,10) }, ...prev]);
    setAssetName(""); notify("Brand asset registered.");
  }
  function addApproval() {
    if (!approvalTitle.trim()) { notify("Enter a content item title."); return; }
    const record: Approval = { id: crypto.randomUUID(), title: approvalTitle.trim(), owner: approvalOwner, status: "In review", score: 0, created: new Date().toLocaleDateString(), notes: approvalNotes.trim() || "Awaiting reviewer assessment." };
    setApprovals(prev => [record, ...prev]); setApprovalTitle(""); setApprovalNotes(""); notify("Content added to approval queue.");
  }
  function setApprovalStatus(id: string, status: Approval["status"]) {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status, score: a.score } : a));
    const item = approvals.find(a => a.id === id);
    if (item) setHistory(prev => [{ id: crypto.randomUUID(), title: item.title, score: item.score, issues: status === "Approved" ? Math.max(0, Math.round((100 - item.score) / 35)) : 1, created: new Date().toLocaleString(), status }, ...prev]);
    notify(`Content marked ${status.toLowerCase()}.`);
  }
  async function testWebhook() {
    if (!webhookUrl.trim()) { notify("Enter a webhook URL first."); return; }
    const payload = { event: "inkloom.audit.completed", source: "Inkloom Shield", timestamp: new Date().toISOString(), data: { message: "Test event", status: "review_required", trustScore: avgScore, pendingApprovals: unresolved, guidelines: guidelines.length } };
    try {
      const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json", ...(webhookSecret ? { "X-Inkloom-Secret": webhookSecret } : {}) }, body: JSON.stringify(payload) });
      setWebhookMessage(`Webhook returned HTTP ${response.status}. ${response.ok ? "Connection test succeeded." : "Check the receiving endpoint and CORS settings."}`);
    } catch (e) { setWebhookMessage("Request could not complete from this browser. The receiver may block CORS or be unreachable. You can still export the sample payload."); }
  }
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="h-4 w-4" /> },
    { id: "knowledge", label: "Brand knowledge", icon: <BookOpen className="h-4 w-4" /> },
    { id: "visual", label: "Visual & WCAG", icon: <Palette className="h-4 w-4" /> },
    { id: "approvals", label: "Approval workflow", icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: "integrations", label: "Integrations", icon: <Webhook className="h-4 w-4" /> },
  ];

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <Navbar />
    <a href="#governance-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:mr-4 focus:top-3 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
      Skip to governance content
    </a>
    <main id="governance-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"><ShieldCheck className="h-3.5 w-3.5" /> ROUND 3 · GOVERNANCE CONTROL CENTER</div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Brand Governance Hub</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage approved knowledge, inspect visual accessibility, route content for review, and connect publishing workflows from one workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className={secondary}><ArrowRight className="h-4 w-4 rotate-180" /> Run content audit</Link>
          <button className={primary} onClick={() => download("inkloom-governance-export.json", { exportedAt: new Date().toISOString(), guidelines, assets, approvals, auditHistory: history })}><Download className="h-4 w-4" /> Export records</button>
        </div>
      </div>

      <div className={`${cx} mb-6 flex gap-1 overflow-x-auto p-1.5`}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${tab === t.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>{t.icon}{t.label}</button>)}
      </div>

      {tab === "overview" && <>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Knowledge documents", value: guidelines.length, sub: `${guidelines.filter(g=>g.status==="Approved").length} approved`, icon: <BookOpen className="h-5 w-5" /> },
            { label: "Registered brand assets", value: assets.length, sub: "Logos, colors & references", icon: <Palette className="h-5 w-5" /> },
            { label: "Pending reviews", value: unresolved, sub: "Require reviewer action", icon: <ClipboardCheck className="h-5 w-5" /> },
            { label: "Average approval score", value: `${avgScore}%`, sub: "Across queued content", icon: <BadgeCheck className="h-5 w-5" /> },
          ].map((s,i)=><div key={s.label} className={`${cx} p-5`}><div className="mb-4 flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{s.label}</span><span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">{s.icon}</span></div><div className="text-3xl font-bold tracking-tight">{s.value}</div><p className="mt-1 text-xs text-slate-400">{s.sub}</p></div>)}
        </div>
        <div className="grid gap-5 lg:grid-cols-5">
          <section className={`${cx} p-5 lg:col-span-3`}>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Approval queue</h2><p className="mt-1 text-xs text-slate-500">Latest content waiting for governance decisions</p></div><button onClick={()=>setTab("approvals")} className="text-xs font-semibold text-indigo-600">Manage queue <ChevronRight className="inline h-3.5 w-3.5" /></button></div>
            <div className="space-y-3">{approvals.slice(0,4).map(a=><div key={a.id} className="flex flex-col justify-between gap-3 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold">{a.title}</p><p className="mt-1 text-xs text-slate-400">{a.owner} · {a.created}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${a.status==="Approved"?"bg-emerald-50 text-emerald-700":a.status==="Rejected"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>{a.status}</span><span className="text-sm font-bold tabular-nums">{a.score}%</span></div></div>)}</div>
          </section>
          <section className={`${cx} p-5 lg:col-span-2`}>
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-600" /><h2 className="font-bold">Governance signals</h2></div>
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3"><div className="mb-1 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">Knowledge coverage</span><span className="font-bold">{Math.min(100, guidelines.length*25)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600" style={{width:`${Math.min(100,guidelines.length*25)}%`}} /></div><p className="mt-2 text-xs text-slate-400">Based on the number of managed guideline categories.</p></div>
              <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="text-xs font-bold text-amber-900">{issueCount ? `${issueCount} possible ambiguous wording signal(s)` : "No simple ambiguity signals detected"}</p><p className="mt-1 text-xs leading-5 text-amber-800">This heuristic is a review aid, not a substitute for legal or compliance approval.</p></div></div>
              <div className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><div><p className="text-xs font-bold text-emerald-900">Local-first demo storage</p><p className="mt-1 text-xs leading-5 text-emerald-800">Hub records persist in this browser. Connect a server database before multi-user production use.</p></div></div>
            </div>
          </section>
        </div>
        <section className={`${cx} mt-5 p-5`}><div className="mb-3 flex items-center gap-2"><Archive className="h-4 w-4 text-slate-500" /><h2 className="font-bold">Audit history</h2></div>{history.length===0?<p className="text-sm text-slate-500">No decisions recorded in this hub yet. Approve or reject an item in the workflow to start building the history.</p>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr><th className="py-2">Content</th><th>Status</th><th>Score</th><th>Recorded</th></tr></thead><tbody>{history.slice(0,10).map(h=><tr key={h.id} className="border-t border-slate-100"><td className="py-3 font-medium">{h.title}</td><td>{h.status}</td><td>{h.score}%</td><td className="text-slate-500">{h.created}</td></tr>)}</tbody></table></div>}</section>
      </>}

      {tab === "knowledge" && <div className="grid gap-5 lg:grid-cols-5">
        <section className={`${cx} p-5 lg:col-span-2`}>
          <div className="mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-indigo-600" /><h2 className="font-bold">Add approved knowledge</h2></div>
          <label className={label}>Document name</label><input className={field} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Product claims v2" />
          <label className={`${label} mt-4`}>Document type</label><select className={field} value={newKind} onChange={e=>setNewKind(e.target.value)}><option>Brand guidelines</option><option>Product specification</option><option>Compliance policy</option><option>Accessibility standard</option><option>Other reference</option></select>
          <label className={`${label} mt-4`}>Source text</label><textarea className={`${field} min-h-44 resize-y`} value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="Paste approved rules, evidence, product specifications or policy text…" />
          <div className="mt-3 flex flex-wrap gap-2"><label className={`${secondary} cursor-pointer`}><Upload className="h-4 w-4" /> Load .txt / .md / .csv / .json<input className="hidden" type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown" onChange={e=>void readGuidelineFile(e.target.files?.[0])} /></label><button className={primary} onClick={addGuideline}><Plus className="h-4 w-4" /> Save document</button></div>
          <p className="mt-3 text-xs leading-5 text-slate-400">Text files are read in the browser. PDF text extraction is not included; paste extracted text for PDFs. Records are stored locally in this browser.</p>
        </section>
        <section className={`${cx} p-5 lg:col-span-3`}>
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Knowledge library</h2><p className="mt-1 text-xs text-slate-500">Versioned records used to manage approved guidance</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{guidelines.length} records</span></div>
          <div className="space-y-3">{guidelines.map(g=><article key={g.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{g.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${g.status==="Approved"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{g.status}</span></div><p className="mt-1 text-xs text-slate-400">{g.kind} · Version {g.version} · Updated {g.updated}</p></div><div className="flex gap-2"><button className={secondary} onClick={()=>setGuidelines(prev=>prev.map(x=>x.id===g.id?{...x,status:x.status==="Approved"?"Draft":"Approved"}:x))}>{g.status==="Approved"?"Mark draft":"Approve"}</button><button title="Delete" className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50" onClick={()=>setDeleteTarget({kind:"guideline",id:g.id})}><Trash2 className="h-4 w-4" /></button></div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{g.content}</p><div className="mt-3 flex justify-end"><button className="text-xs font-semibold text-indigo-600" onClick={() => startGuidelineEdit(g)}>Edit in form <ChevronRight className="inline h-3 w-3" /></button></div></article>)}</div>
        </section>
      </div>}

      {tab === "visual" && <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${cx} p-5`}>
          <div className="mb-1 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-indigo-600" /><h2 className="font-bold">Visual asset inspection</h2></div><p className="mb-5 text-sm text-slate-500">Preview an image, register approved brand assets, and check its metadata and palette notes.</p>
          <label className={label}>Choose image to inspect</label><input className={`${field} file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold`} type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setVisualFile(f);setVisualPreview(URL.createObjectURL(f));}}} />
          {visualPreview && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><Image src={visualPreview} alt="Selected visual for inspection" width={800} height={600} unoptimized className="mx-auto max-h-64 max-w-full rounded-lg object-contain" /><div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold">{visualFile?.name}</span><span className="shrink-0 text-slate-500">{visualFile ? `${Math.round(visualFile.size/1024)} KB` : ""}</span></div><p className="mt-2 text-xs leading-5 text-amber-700">Manual review required: this demo previews the image but does not claim AI-powered logo identity detection. Compare it against the approved logo reference before publication.</p></div>}
          {visualPreview && <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3"><button className={secondary} onClick={inspectPalette}><Palette className="h-4 w-4" /> Sample image palette</button>{sampledColors.length>0 && <div className="mt-3 flex flex-wrap gap-2">{sampledColors.map(c=><div key={c} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs"><span className="h-4 w-4 rounded-full border border-slate-200" style={{backgroundColor:c}} />{c}</div>)}</div>}{paletteReport && <p className="mt-2 text-xs leading-5 text-slate-600">{paletteReport}</p>}</div>}
          <div className="my-5 border-t border-slate-100" />
          <h3 className="mb-3 text-sm font-bold">Register approved asset</h3><label className={label}>Asset name</label><input className={field} value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="Primary logo, campaign palette…" />
          <label className={`${label} mt-3`}>Asset type</label><select className={field} value={assetType} onChange={e=>setAssetType(e.target.value)}><option>Logo</option><option>Color system</option><option>Typography</option><option>Iconography</option><option>Image style</option><option>Other</option></select>
          <label className={`${label} mt-3`}>Approved colors / notes</label><input className={field} value={assetColors} onChange={e=>setAssetColors(e.target.value)} placeholder="#4338CA, #0F172A, white background" />
          <button className={`${primary} mt-4`} onClick={addAsset}><Plus className="h-4 w-4" /> Register asset</button>
        </section>
        <section className={`${cx} p-5`}>
          <div className="mb-1 flex items-center gap-2"><Palette className="h-5 w-5 text-indigo-600" /><h2 className="font-bold">WCAG contrast checker</h2></div><p className="mb-5 text-sm text-slate-500">Calculate contrast ratio for text and background colors using the WCAG relative-luminance formula.</p>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Text color</label><div className="flex gap-2"><input className={`${field} font-mono`} value={fg} onChange={e=>setFg(e.target.value)} /><input aria-label="Text color picker" type="color" className="h-11 w-12 cursor-pointer rounded-lg border border-slate-200 p-1" value={/^#[0-9a-f]{6}$/i.test(fg)?fg:"#ffffff"} onChange={e=>setFg(e.target.value.toUpperCase())} /></div></div><div><label className={label}>Background color</label><div className="flex gap-2"><input className={`${field} font-mono`} value={bg} onChange={e=>setBg(e.target.value)} /><input aria-label="Background color picker" type="color" className="h-11 w-12 cursor-pointer rounded-lg border border-slate-200 p-1" value={/^#[0-9a-f]{6}$/i.test(bg)?bg:"#4338ca"} onChange={e=>setBg(e.target.value.toUpperCase())} /></div></div></div>
          <div className="my-5 rounded-xl border p-6 text-center" style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(bg)?bg:"#4338ca",color:/^#[0-9a-f]{6}$/i.test(fg)?fg:"#ffffff"}}><p className="text-2xl font-bold">Brand message preview</p><p className="mt-2 text-sm">The quick brown fox jumps over the lazy dog.</p><p className="mt-2 text-xs">Aa · 14px regular · sample text</p></div>
          <div className={`rounded-xl border p-4 ${wcagAA?"border-emerald-200 bg-emerald-50":"border-red-200 bg-red-50"}`}><div className="flex items-center justify-between"><span className="text-sm font-bold">Contrast ratio</span><span className="text-2xl font-extrabold tabular-nums">{ratio===null?"—":`${ratio.toFixed(2)}:1`}</span></div><p className={`mt-1 text-sm font-semibold ${wcagAA?"text-emerald-700":"text-red-700"}`}>{ratio===null?"Enter valid 6-digit hex colors":wcagAA?"WCAG AA passes for normal text (4.5:1)": "WCAG AA fails for normal text (needs 4.5:1)"}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/70 p-2"><span className="font-bold">AA large text</span><p className="mt-1">{ratio!==null&&ratio>=3?"Pass · 3:1":"Fail · needs 3:1"}</p></div><div className="rounded-lg bg-white/70 p-2"><span className="font-bold">AAA normal text</span><p className="mt-1">{ratio!==null&&ratio>=7?"Pass · 7:1":"Fail · needs 7:1"}</p></div></div></div>
          <p className="mt-3 text-xs leading-5 text-slate-400">This checker evaluates the two supplied solid colors. It does not automatically sample gradients, images, transparency, font weights, or every element in an uploaded image.</p>
        </section>
        <section className={`${cx} p-5 lg:col-span-2`}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Brand asset register</h2><p className="mt-1 text-xs text-slate-500">Approved reference assets and documented color notes</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{assets.length} assets</span></div><div className="grid gap-3 md:grid-cols-2">{assets.map(a=><div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{a.name}</p><p className="mt-1 text-xs text-slate-400">{a.type} · {a.updated}</p><p className="mt-2 break-words text-sm text-slate-600">{a.colors}</p></div><button aria-label={`Delete ${a.name}`} onClick={()=>setDeleteTarget({kind:"asset",id:a.id})} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>)}</div></section>
      </div>}

      {tab === "approvals" && <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${cx} p-5 lg:col-span-1`}><h2 className="mb-4 font-bold">Submit for review</h2><label className={label}>Content title</label><input className={field} value={approvalTitle} onChange={e=>setApprovalTitle(e.target.value)} placeholder="Campaign or content name" /><label className={`${label} mt-4`}>Submitting team</label><select className={field} value={approvalOwner} onChange={e=>setApprovalOwner(e.target.value)}><option>Marketing</option><option>Product</option><option>Legal & compliance</option><option>Customer success</option><option>Design</option></select><label className={`${label} mt-4`}>Reviewer notes</label><textarea className={`${field} min-h-24`} value={approvalNotes} onChange={e=>setApprovalNotes(e.target.value)} placeholder="Claims to verify, deadline, context…" /><button className={`${primary} mt-4 w-full`} onClick={addApproval}><Plus className="h-4 w-4" /> Add to review queue</button><p className="mt-3 text-xs leading-5 text-slate-400">This workflow tracks human review decisions. Approval is not legal certification and does not itself run an audit.</p></section>
        <section className={`${cx} p-5 lg:col-span-2`}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Content review queue</h2><p className="mt-1 text-xs text-slate-500">Reviewers can approve, reject or return an item for review</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{unresolved} pending</span></div><div className="space-y-3">{approvals.map(a=><article key={a.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{a.title}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.status==="Approved"?"bg-emerald-50 text-emerald-700":a.status==="Rejected"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>{a.status}</span></div><p className="mt-1 text-xs text-slate-400">{a.owner} · Submitted {a.created}</p><p className="mt-2 text-sm leading-5 text-slate-600">{a.notes}</p></div><div className="shrink-0 text-right"><p className="text-xl font-extrabold">{a.score}%</p><p className="text-[10px] text-slate-400">trust score</p></div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3"><button className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`} onClick={()=>setApprovalStatus(a.id,"Approved")}><Check className="h-4 w-4" /> Approve</button><button className={`${btn} bg-red-50 text-red-700 hover:bg-red-100`} onClick={()=>setApprovalStatus(a.id,"Rejected")}><XCircle className="h-4 w-4" /> Reject</button><button className={secondary} onClick={()=>setApprovalStatus(a.id,"In review")}><RefreshCw className="h-4 w-4" /> Return to review</button><button className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete item" onClick={()=>setDeleteTarget({kind:"approval",id:a.id})}><Trash2 className="h-4 w-4" /></button></div></article>)}</div></section>
        <section className={`${cx} p-5 lg:col-span-3`}><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Immutable-style decision log</h2><button className={secondary} onClick={()=>download("inkloom-audit-history.json",history)}><Download className="h-4 w-4" /> Export history</button></div>{history.length===0?<p className="text-sm text-slate-500">Decisions made above will be recorded here.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr><th className="py-2">Content</th><th>Decision</th><th>Trust score</th><th>Timestamp</th></tr></thead><tbody>{history.map(h=><tr key={h.id} className="border-t border-slate-100"><td className="py-3 font-medium">{h.title}</td><td>{h.status}</td><td>{h.score}%</td><td className="text-slate-500">{h.created}</td></tr>)}</tbody></table></div>}<p className="mt-3 text-xs text-slate-400">The log is browser-stored and editable by the local user; use server-side append-only logging and authentication for a production-grade immutable audit trail.</p></section>
      </div>}

      {tab === "integrations" && <div className="grid gap-5 lg:grid-cols-5">
        <section className={`${cx} p-5 lg:col-span-3`}><div className="mb-1 flex items-center gap-2"><Webhook className="h-5 w-5 text-indigo-600" /><h2 className="font-bold">Publishing webhook</h2></div><p className="mb-5 text-sm leading-6 text-slate-500">Configure an endpoint to receive governance events. Use your own trusted receiver; browser requests may be blocked by CORS policies.</p><label className={label}>Receiver URL</label><input className={field} value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} placeholder="https://your-server.example.com/webhooks/inkloom" /><label className={`${label} mt-4`}>Shared secret (optional)</label><input type="password" className={field} value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} placeholder="Stored locally in this browser" /><div className="mt-4 flex flex-wrap gap-2"><button className={primary} onClick={()=>void testWebhook()}><Activity className="h-4 w-4" /> Send test event</button><button className={secondary} onClick={()=>download("inkloom-webhook-sample.json",{event:"inkloom.audit.completed",timestamp:new Date().toISOString(),data:{status:"review_required",trustScore:avgScore,pendingApprovals:unresolved}})}><Download className="h-4 w-4" /> Export sample payload</button></div>{webhookMessage&&<div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{webhookMessage}</div>}<p className="mt-4 text-xs leading-5 text-slate-400">For production, send webhooks from a server-side route, validate the destination, sign payloads, and keep secrets out of browser storage. Do not enter a sensitive production secret here.</p></section>
        <section className={`${cx} p-5 lg:col-span-2`}><h2 className="mb-4 font-bold">Integration readiness</h2><div className="space-y-3">{[{name:"WordPress",desc:"Use a plugin or server webhook to audit drafts before publication.",status:"Integration blueprint"},{name:"HubSpot",desc:"Connect through a private app or workflow webhook.",status:"Integration blueprint"},{name:"CMS-neutral webhooks",desc:"Send JSON event payloads to a configured receiver.",status:"Browser test available"}].map(x=><div key={x.name} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{x.name}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${x.status==="Browser test available"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{x.status}</span></div><p className="mt-2 text-sm leading-5 text-slate-500">{x.desc}</p></div>)}</div><div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Deployment note:</strong> WordPress and HubSpot OAuth/API connections are not preconfigured. Add provider credentials, server-side authentication and deployment-specific testing before claiming native integration.</div></section>
      </div>}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">Confirm deletion</h2>
            <p className="mt-2 text-sm text-slate-600">
              Delete this {deleteTarget.kind} record? The action will be reflected in the current local view immediately.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className={secondary} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className={`${primary} bg-red-600 hover:bg-red-700`} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row"><p>Inkloom Shield · Round 3 governance tools</p><p>Demo-ready local persistence · Human review required for compliance decisions</p></footer>
    </main>
    {toast && <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />{toast}</div>}
  </div>;
}
